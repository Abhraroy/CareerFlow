import { AppRoute, isPortalRoute } from './types'

export interface RectBounds {
  x: number
  y: number
  width: number
  height: number
}

class PortalControllerClass {
  private lastActivePortalId: string | null = null
  private lastBounds: RectBounds | null = null
  private rafId: number | null = null

  public show(portalId: string, forceReset?: boolean): void {
    if (this.lastActivePortalId === portalId && !forceReset) return
    this.lastActivePortalId = portalId
    if (typeof window !== 'undefined' && window.api?.switchPortal) {
      window.api.switchPortal(portalId, forceReset)
    }
  }

  public hide(): void {
    if (this.lastActivePortalId === 'none') return
    this.lastActivePortalId = 'none'
    this.lastBounds = null
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (typeof window !== 'undefined' && window.api?.switchPortal) {
      window.api.switchPortal('none')
    }
  }

  public updateBounds(bounds: RectBounds): void {
    if (typeof window === 'undefined' || !window.api?.updateBounds) return

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
    }

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      const rounded: RectBounds = {
        x: Math.round(bounds.x),
        y: Math.round(bounds.y),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height)
      }

      if (
        this.lastBounds &&
        this.lastBounds.x === rounded.x &&
        this.lastBounds.y === rounded.y &&
        this.lastBounds.width === rounded.width &&
        this.lastBounds.height === rounded.height
      ) {
        return
      }

      this.lastBounds = rounded
      window.api.updateBounds(rounded)
    })
  }

  public syncWithRoute(route: AppRoute): void {
    if (isPortalRoute(route)) {
      this.show(route.portalId)
    } else {
      this.hide()
    }
  }
}

export const PortalController = new PortalControllerClass()
