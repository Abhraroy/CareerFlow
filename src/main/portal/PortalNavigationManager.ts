import { BrowserWindow, WebContentsView, shell } from 'electron'
import type {
  PortalRuntimeState,
  NavigationAction,
  RectBounds
} from './PortalTypes'
import { getPortalConfig, DEFAULT_USER_AGENT, DEFAULT_AUTH_RULES } from './portalConfigs'
import {
  resolveNavigationUrl,
  classifyNavigation,
  resolveNavigationPolicy
} from './PortalUrlResolver'
import { PortalLogger } from './PortalLogger'
import { linkedinJobPageScraper } from '../../scrapperEngine/linkedinScrapper'
import { writeToFile, JOB_DESCRIPTION_FILE } from '../../utils/FileOperations'
import Logger from '../../utils/logger'
import { cleanJobText } from '../../utils/cleanJobText'


export class PortalNavigationManager {
  private static instance: PortalNavigationManager
  private mainWindow: BrowserWindow | null = null
  private portRuntimeStates: Record<string, PortalRuntimeState> = {}
  private activePortalId: string | null = null
  private currentBounds: RectBounds = { x: 0, y: 0, width: 0, height: 0 }
  private externalBehavior: 'controlled' | 'system' = 'system'

  private constructor() {}

  public static getInstance(): PortalNavigationManager {
    if (!PortalNavigationManager.instance) {
      PortalNavigationManager.instance = new PortalNavigationManager()
    }
    return PortalNavigationManager.instance
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  public setExternalBehavior(behavior: 'controlled' | 'system'): void {
    this.externalBehavior = behavior
    PortalLogger.log('global', 'set-external-behavior', behavior)
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('portal:external-behavior-changed', behavior)
    }
  }

  public getExternalBehavior(): 'controlled' | 'system' {
    return this.externalBehavior
  }

  public getActivePortalId(): string | null {
    return this.activePortalId
  }

  private getOrCreateRuntimeState(portalId: string): PortalRuntimeState {
    if (this.portRuntimeStates[portalId]) {
      return this.portRuntimeStates[portalId]
    }

    const config = getPortalConfig(portalId)
    const view = new WebContentsView({
      webPreferences: {
        partition: `persist:${portalId}`,
        sandbox: true
      }
    })

    const userAgent = config.userAgent || DEFAULT_USER_AGENT
    view.webContents.setUserAgent(userAgent)

    const runtimeState: PortalRuntimeState = {
      portalId,
      view,
      initialized: false,
      state: {
        portalId,
        url: config.defaultUrl,
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        error: null
      }
    }

    this.portRuntimeStates[portalId] = runtimeState
    this.setupViewEventListeners(portalId, runtimeState)

    if (this.mainWindow) {
      this.mainWindow.contentView.addChildView(view)
    }

    // Load default URL ONCE upon creation
    PortalLogger.log(portalId, 'create-view', `Loading default URL: ${config.defaultUrl}`)
    runtimeState.initialized = true
    view.webContents.loadURL(config.defaultUrl).catch((err) => {
      PortalLogger.error(portalId, 'initial-loadURL-error', err)
    })

    return runtimeState
  }

  private setupViewEventListeners(portalId: string, runtimeState: PortalRuntimeState): void {
    const { view } = runtimeState

    // 1. Navigation started
    view.webContents.on('did-start-navigation', (event) => {
      // Ignore in-page SPA subframe navigation events for main loading state
      if (event.isMainFrame) {
        runtimeState.state.isLoading = true
        runtimeState.state.error = null
        PortalLogger.log(portalId, 'did-start-navigation', event.url)
        this.syncPortalState(portalId)
      }
    })

    // 2. Full main-frame navigation complete
    view.webContents.on('did-navigate', (_, url) => {
      runtimeState.state.url = url
      runtimeState.state.canGoBack = view.webContents.canGoBack()
      runtimeState.state.canGoForward = view.webContents.canGoForward()
      PortalLogger.log(
        portalId,
        'did-navigate',
        `${url} (back: ${runtimeState.state.canGoBack}, fwd: ${runtimeState.state.canGoForward})`
      )
      this.syncPortalState(portalId)
    })

    // 3. SPA in-page navigation (History API pushState / replaceState / hashchange)
    view.webContents.on('did-navigate-in-page', (_, url) => {
      runtimeState.state.url = url
      runtimeState.state.canGoBack = view.webContents.canGoBack()
      runtimeState.state.canGoForward = view.webContents.canGoForward()
      PortalLogger.log(portalId, 'did-navigate-in-page', url)
      this.syncPortalState(portalId)
      this.injectApplyDetectionWatcher(view, portalId)
    })

    // 4. Loading stopped
    view.webContents.on('did-stop-loading', () => {
      runtimeState.state.isLoading = false
      runtimeState.state.canGoBack = view.webContents.canGoBack()
      runtimeState.state.canGoForward = view.webContents.canGoForward()
      PortalLogger.log(portalId, 'did-stop-loading')
      this.syncPortalState(portalId)
      this.injectApplyDetectionWatcher(view, portalId)
    })

    // 4b. Listen for dynamic apply button clicks intercepted via console.log
    view.webContents.on('console-message', (_event, _level, message) => {
      if (message && message.startsWith('[JOBCOPILOT_APPLY_CLICK]')) {
        try {
          const payloadStr = message.replace('[JOBCOPILOT_APPLY_CLICK]', '').trim()
          const data = JSON.parse(payloadStr)
          PortalLogger.log(portalId, 'apply-click-detected', data.url)

          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('portal:detected-apply-click', {
              portalId,
              ...data
            })
          }
        } catch (err) {
          PortalLogger.error(portalId, 'parse-apply-click-error', err)
        }
      }
    })

    // 5. Navigation failed
    view.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL, isMainFrame) => {
      // Ignore cancelled navigations (ERR_ABORTED = -3) or subframe failures
      if (!isMainFrame || errorCode === -3) {
        return
      }
      runtimeState.state.isLoading = false
      runtimeState.state.error = {
        code: errorCode,
        description: errorDescription,
        url: validatedURL
      }
      PortalLogger.log(portalId, 'did-fail-load', `[${errorCode}] ${errorDescription} - ${validatedURL}`)
      this.syncPortalState(portalId)
    })

    // 6. Process crashed / unresponsive safety
    view.webContents.on('render-process-gone', (_, details) => {
      runtimeState.state.isLoading = false
      runtimeState.state.error = {
        code: -1,
        description: `Renderer process lost: ${details.reason}`,
        url: view.webContents.getURL()
      }
      PortalLogger.error(portalId, 'render-process-gone', details.reason)
      this.syncPortalState(portalId)
    })

    // 7. Window Open Handler (Popups, OAuth, External links)
    view.webContents.setWindowOpenHandler((details) => {
      const rawUrl = details.url || ''
      const config = getPortalConfig(portalId)

      // 1. Resolve wrapper URLs dynamically (e.g. LinkedIn safety redirect wrapper)
      const resolvedUrl = resolveNavigationUrl(rawUrl, config.navigation)

      // 2. Classify navigation (internal vs auth vs external)
      const navigationKind = classifyNavigation(resolvedUrl, config, DEFAULT_AUTH_RULES)

      // 3. Resolve navigation policy
      const policy = resolveNavigationPolicy(navigationKind, config.navigation, this.externalBehavior)

      // Structured logging
      PortalLogger.log(
        portalId,
        'window-open-request',
        `rawUrl: ${rawUrl} | resolvedUrl: ${resolvedUrl} | kind: ${navigationKind} | policy: ${policy.type} | disposition: ${details.disposition}`
      )

      // 4. Execute policy
      switch (policy.type) {
        case 'internal': {
          PortalLogger.log(portalId, 'window-open-internal', resolvedUrl)
          view.webContents.loadURL(resolvedUrl).catch((err) => {
            PortalLogger.error(portalId, 'window-open-loadURL-error', err)
          })
          return { action: 'deny' }
        }

        case 'auth': {
          PortalLogger.log(portalId, 'window-open-auth', resolvedUrl)
          return {
            action: 'allow',
            overrideBrowserWindowOptions: {
              parent: this.mainWindow || undefined,
              modal: false,
              width: 650,
              height: 750,
              webPreferences: {
                sandbox: true
              }
            }
          }
        }

        case 'external_controlled': {
          PortalLogger.log(portalId, 'window-open-external-controlled', resolvedUrl)
          this.emitApplyClickSignal(portalId, resolvedUrl, 'Apply (External Site)')

          if (resolvedUrl !== rawUrl) {
            const child = new BrowserWindow({
              parent: this.mainWindow || undefined,
              width: 1024,
              height: 800,
              webPreferences: {
                partition: `persist:${portalId}`,
                sandbox: true
              }
            })
            child.loadURL(resolvedUrl).catch((err) => {
              PortalLogger.error(portalId, 'external-controlled-child-load-error', err)
            })
            return { action: 'deny' }
          }

          return {
            action: 'allow',
            overrideBrowserWindowOptions: {
              parent: this.mainWindow || undefined,
              modal: false,
              width: 1024,
              height: 800,
              webPreferences: {
                partition: `persist:${portalId}`,
                sandbox: true
              }
            }
          }
        }

        case 'external_system': {
          PortalLogger.log(portalId, 'window-open-external-system', resolvedUrl)
          this.emitApplyClickSignal(portalId, resolvedUrl, 'Apply (External Site)')
          shell.openExternal(resolvedUrl).catch((err) => {
            PortalLogger.error(portalId, 'openExternal-error', err)
          })
          return { action: 'deny' }
        }

        default:
          return { action: 'deny' }
      }
    })

    // 8. In-page Main-Frame Navigation Interceptor (Handles direct frame navigations to external / wrapper / auth URLs)
    view.webContents.on('will-navigate', (event, navigationUrl) => {
      const rawUrl = navigationUrl || ''
      const config = getPortalConfig(portalId)

      // 1. Resolve wrapper URLs dynamically (e.g. LinkedIn safety redirect wrapper)
      const resolvedUrl = resolveNavigationUrl(rawUrl, config.navigation)

      // 2. Classify navigation (internal vs auth vs external)
      const navigationKind = classifyNavigation(resolvedUrl, config, DEFAULT_AUTH_RULES)

      // 3. Resolve navigation policy
      const policy = resolveNavigationPolicy(navigationKind, config.navigation, this.externalBehavior)

      PortalLogger.log(
        portalId,
        'will-navigate-request',
        `rawUrl: ${rawUrl} | resolvedUrl: ${resolvedUrl} | kind: ${navigationKind} | policy: ${policy.type}`
      )

      if (policy.type === 'internal') {
        if (resolvedUrl !== rawUrl) {
          event.preventDefault()
          view.webContents.loadURL(resolvedUrl).catch((err) => {
            PortalLogger.error(portalId, 'will-navigate-internal-redirect-error', err)
          })
        }
        return
      }

      // Intercept non-internal navigations (prevent main frame from navigating inside the app)
      event.preventDefault()

      switch (policy.type) {
        case 'auth': {
          PortalLogger.log(portalId, 'will-navigate-auth', resolvedUrl)
          const authWindow = new BrowserWindow({
            parent: this.mainWindow || undefined,
            modal: false,
            width: 650,
            height: 750,
            webPreferences: {
              sandbox: true
            }
          })
          authWindow.loadURL(resolvedUrl).catch((err) => {
            PortalLogger.error(portalId, 'will-navigate-auth-load-error', err)
          })
          break
        }

        case 'external_controlled': {
          PortalLogger.log(portalId, 'will-navigate-external-controlled', resolvedUrl)
          this.emitApplyClickSignal(portalId, resolvedUrl, 'Apply (External Navigation)')
          const child = new BrowserWindow({
            parent: this.mainWindow || undefined,
            width: 1024,
            height: 800,
            webPreferences: {
              partition: `persist:${portalId}`,
              sandbox: true
            }
          })
          child.loadURL(resolvedUrl).catch((err) => {
            PortalLogger.error(portalId, 'will-navigate-external-controlled-load-error', err)
          })
          break
        }

        case 'external_system': {
          PortalLogger.log(portalId, 'will-navigate-external-system', resolvedUrl)
          this.emitApplyClickSignal(portalId, resolvedUrl, 'Apply (External Navigation)')
          shell.openExternal(resolvedUrl).catch((err) => {
            PortalLogger.error(portalId, 'will-navigate-openExternal-error', err)
          })
          break
        }
      }
    })
  }

  public syncPortalState(portalId: string): void {
    const runtimeState = this.portRuntimeStates[portalId]
    if (!runtimeState || !this.mainWindow) return

    // Ensure live URL and back/forward status from webContents
    try {
      if (!runtimeState.view.webContents.isDestroyed()) {
        runtimeState.state.url = runtimeState.view.webContents.getURL()
        runtimeState.state.canGoBack = runtimeState.view.webContents.canGoBack()
        runtimeState.state.canGoForward = runtimeState.view.webContents.canGoForward()
      }
    } catch {
      // Ignore destroyed checks
    }

    // Always send state if this is the currently active portal
    if (this.activePortalId === portalId) {
      this.mainWindow.webContents.send('portal:navigation-state', {
        ...runtimeState.state
      })
    }
  }

  public switchPortal(portalId: string, resetToDefault = false): void {
    if (!this.mainWindow) return

    PortalLogger.log(portalId, 'switch-portal', `resetToDefault: ${resetToDefault}`)

    if (portalId === 'none') {
      this.activePortalId = null
      for (const runtimeState of Object.values(this.portRuntimeStates)) {
        runtimeState.view.setVisible(false)
        runtimeState.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      }
      return
    }

    this.activePortalId = portalId
    const runtimeState = this.getOrCreateRuntimeState(portalId)
    const config = getPortalConfig(portalId)

    // Reset URL ONLY if explicitly requested by user
    if (resetToDefault) {
      PortalLogger.log(portalId, 'resetToDefault', config.defaultUrl)
      runtimeState.view.webContents.loadURL(config.defaultUrl).catch((err) => {
        PortalLogger.error(portalId, 'resetToDefault-error', err)
      })
    }

    // Toggle visibility for all views
    for (const [id, state] of Object.entries(this.portRuntimeStates)) {
      if (id === portalId) {
        state.view.setVisible(true)
      } else {
        state.view.setVisible(false)
        state.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      }
    }

    this.applyBoundsToActiveView()
    this.syncPortalState(portalId)
  }

  public navigate(portalId: string | undefined, action: NavigationAction): void {
    const targetId = portalId || this.activePortalId
    if (!targetId) return

    const runtimeState = this.portRuntimeStates[targetId]
    if (!runtimeState || runtimeState.view.webContents.isDestroyed()) return

    const { webContents } = runtimeState.view
    PortalLogger.log(targetId, 'navigate', action)

    if (action === 'back' && webContents.canGoBack()) {
      webContents.goBack()
    } else if (action === 'forward' && webContents.canGoForward()) {
      webContents.goForward()
    } else if (action === 'reload') {
      webContents.reload()
    }
  }

  public loadURL(portalId: string | undefined, rawUrl: string): void {
    const targetId = portalId || this.activePortalId
    if (!targetId) return

    const runtimeState = this.portRuntimeStates[targetId]
    if (!runtimeState || runtimeState.view.webContents.isDestroyed()) return

    let target = rawUrl.trim()
    if (!target) return

    if (!/^https?:\/\//i.test(target)) {
      target = 'https://' + target
    }

    PortalLogger.log(targetId, 'loadURL', target)
    runtimeState.view.webContents.loadURL(target).catch((err) => {
      PortalLogger.error(targetId, 'loadURL-error', err)
    })
  }

  public updateBounds(rect: RectBounds): void {
    // Validate bounds values
    const rounded: RectBounds = {
      x: Math.max(0, Math.round(rect.x)),
      y: Math.max(0, Math.round(rect.y)),
      width: Math.max(0, Math.round(rect.width)),
      height: Math.max(0, Math.round(rect.height))
    }

    // Skip if bounds haven't changed
    if (
      this.currentBounds.x === rounded.x &&
      this.currentBounds.y === rounded.y &&
      this.currentBounds.width === rounded.width &&
      this.currentBounds.height === rounded.height
    ) {
      return
    }

    this.currentBounds = rounded
    this.applyBoundsToActiveView()
  }

  private applyBoundsToActiveView(): void {
    if (!this.activePortalId || !this.mainWindow) return
    const runtimeState = this.portRuntimeStates[this.activePortalId]
    if (
      !runtimeState ||
      runtimeState.view.webContents.isDestroyed() ||
      this.currentBounds.width <= 0 ||
      this.currentBounds.height <= 0
    ) {
      return
    }

    runtimeState.view.setBounds(this.currentBounds)
  }

  public async getActiveText(): Promise<any> {
    let activeState: PortalRuntimeState | null = null

    if (this.activePortalId && this.portRuntimeStates[this.activePortalId]) {
      activeState = this.portRuntimeStates[this.activePortalId]
    } else {
      const firstEntry = Object.values(this.portRuntimeStates)[0]
      if (firstEntry) activeState = firstEntry
    }

    if (!activeState || activeState.view.webContents.isDestroyed()) {
      Logger.error('PortalNavigationManager.ts', 'getActiveText', 'No active or visible WebContentsView found for scraping.')
      return ''
    }

    try {
      const result = await activeState.view.webContents.executeJavaScript(linkedinJobPageScraper())

      if (result?.data?.aboutJob) {
        result.data.aboutJob = cleanJobText(result.data.aboutJob)
      }

      if (result?.data?.aboutCompany) {
        result.data.aboutCompany = cleanJobText(result.data.aboutCompany)
      }

      if (!result?.success) {
        Logger.error('PortalNavigationManager.ts', 'getActiveText', 'SCRAPER ERROR', result?.error)
      }

      if (result?.data) {
        try {
          await writeToFile(JOB_DESCRIPTION_FILE, result.data)
        } catch (saveErr) {
          Logger.error('PortalNavigationManager.ts', 'getActiveText', 'Failed to save job description to storage', saveErr)
        }
      }

      return result?.data || ''
    } catch (err) {
      Logger.error('PortalNavigationManager.ts', 'getActiveText', 'Error executing scraper script', err)
      return ''
    }
  }

  private injectApplyDetectionWatcher(view: WebContentsView, _portalId: string): void {
    if (view.webContents.isDestroyed()) return

    const script = `
      (function() {
        if (window.__jobcopilot_apply_watcher_attached) return;
        window.__jobcopilot_apply_watcher_attached = true;

        const APPLY_KEYWORDS = ['apply', 'easy apply', 'submit application', 'apply now', 'apply on company', 'postuler', 'solicitar'];

        function checkApply(el) {
          if (!el) return false;
          const target = el.closest ? el.closest('button, a, input[type="submit"], input[type="button"], [role="button"]') : null;
          if (!target) return false;

          const text = (target.innerText || target.textContent || target.value || target.getAttribute('aria-label') || target.getAttribute('title') || '').toLowerCase().trim();
          const href = (target.getAttribute('href') || '').toLowerCase();
          const dataControl = (target.getAttribute('data-control-name') || target.getAttribute('data-automation-id') || '').toLowerCase();

          if (APPLY_KEYWORDS.some(function(kw) { return text.includes(kw); })) return true;
          if (dataControl.includes('apply')) return true;
          if (href.includes('/apply') || href.includes('job-apply') || href.includes('jobapply')) return true;

          return false;
        }

        document.addEventListener('click', function(e) {
          try {
            const target = e.target;
            if (checkApply(target)) {
              const matchedEl = target.closest ? target.closest('button, a, input[type="submit"], input[type="button"], [role="button"]') : target;
              const btnText = (matchedEl.innerText || matchedEl.textContent || matchedEl.getAttribute('aria-label') || 'Apply').trim();
              const pageTitle = document.title || '';
              const url = window.location.href;
              console.log('[JOBCOPILOT_APPLY_CLICK]', JSON.stringify({ url: url, buttonText: btnText, pageTitle: pageTitle, timestamp: new Date().toISOString() }));
            }
          } catch(err) {}
        }, true);
      })();
    `

    view.webContents.executeJavaScript(script).catch(() => {})
  }

  public emitApplyClickSignal(
    portalId: string,
    url: string,
    buttonText = 'Apply Link',
    pageTitle = 'Job Application'
  ): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      PortalLogger.log(portalId, 'emit-apply-click-signal', url)
      this.mainWindow.webContents.send('portal:detected-apply-click', {
        portalId,
        url,
        buttonText,
        pageTitle,
        timestamp: new Date().toISOString()
      })
    }
  }
}
