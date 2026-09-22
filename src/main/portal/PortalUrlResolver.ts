import type {
  PortalConfig,
  PortalNavigationConfig,
  PortalWrapperRule,
  PortalAuthRule,
  NavigationKind,
  NavigationPolicy
} from './PortalTypes'

/**
 * Securely matches a target hostname against a configured domain or hostname.
 * Correctly handles exact matches and subdomains (e.g. jobs.linkedin.com -> linkedin.com),
 * while rejecting invalid matches (e.g. evil-linkedin.com or linkedin.com.evil.com).
 */
export function matchHostname(targetHostname: string, domainOrHost: string): boolean {
  if (!targetHostname || !domainOrHost) return false

  const target = targetHostname.toLowerCase().replace(/\.$/, '')
  const domain = domainOrHost.toLowerCase().replace(/^www\./, '').replace(/\.$/, '')

  if (target === domain) return true
  if (target.endsWith('.' + domain)) return true

  // Also check if target without 'www.' equals domain
  const targetNoWww = target.replace(/^www\./, '')
  if (targetNoWww === domain) return true

  return false
}

/**
 * Checks if a parsed URL matches a configured wrapper rule.
 */
export function matchesWrapperRule(url: URL, rule: PortalWrapperRule): boolean {
  const { match } = rule
  if (!match) return false

  let hasMatchCriteria = false

  if (match.hostnames && match.hostnames.length > 0) {
    hasMatchCriteria = true
    const hostMatched = match.hostnames.some((h) => matchHostname(url.hostname, h))
    if (!hostMatched) return false
  }

  if (match.paths && match.paths.length > 0) {
    hasMatchCriteria = true
    const normalizedPath = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/'
    const pathMatched = match.paths.some((p) => {
      const normP = p.endsWith('/') ? p : p + '/'
      return url.pathname === p || normalizedPath === normP
    })
    if (!pathMatched) return false
  }

  if (match.pathPrefixes && match.pathPrefixes.length > 0) {
    hasMatchCriteria = true
    const prefixMatched = match.pathPrefixes.some((prefix) => url.pathname.startsWith(prefix))
    if (!prefixMatched) return false
  }

  return hasMatchCriteria
}

/**
 * Generic URL resolver that extracts destination URLs from configured wrapper URLs
 * (e.g., LinkedIn safety redirect wrappers). Supports nested resolution up to maxDepth.
 */
export function resolveNavigationUrl(
  rawUrl: string,
  config?: PortalNavigationConfig,
  maxDepth = 5
): string {
  if (!rawUrl || typeof rawUrl !== 'string') return ''

  let currentUrl = rawUrl.trim()
  const wrappers = config?.wrappers

  if (!wrappers || wrappers.length === 0) {
    return currentUrl
  }

  let depth = 0

  while (depth < maxDepth) {
    let parsedUrl: URL
    try {
      parsedUrl = new URL(currentUrl)
    } catch {
      // Invalid URL syntax - return current string safely
      return currentUrl
    }

    const matchingRule = wrappers.find((rule) => matchesWrapperRule(parsedUrl, rule))
    if (!matchingRule || !matchingRule.destination?.queryParam) {
      break
    }

    const paramName = matchingRule.destination.queryParam
    const destParam = parsedUrl.searchParams.get(paramName)

    if (!destParam) {
      break
    }

    let nextUrlStr = destParam.trim()

    // Try decoding URI component if double-encoded
    try {
      if (nextUrlStr.includes('%3A') || nextUrlStr.includes('%2F')) {
        nextUrlStr = decodeURIComponent(nextUrlStr)
      }
    } catch {
      // Ignore decode error and use raw param value
    }

    // Resolve relative or full destination URL
    try {
      if (/^https?:\/\//i.test(nextUrlStr)) {
        currentUrl = new URL(nextUrlStr).href
      } else {
        currentUrl = new URL(nextUrlStr, parsedUrl.origin).href
      }
      depth++
    } catch {
      // Could not parse destination URL cleanly - abort depth search
      break
    }
  }

  return currentUrl
}

/**
 * Checks if a parsed URL matches an authentication rule.
 */
export function matchesAuthRule(url: URL, rule: PortalAuthRule): boolean {
  let hasRuleCriteria = false

  if (rule.hostnames && rule.hostnames.length > 0) {
    hasRuleCriteria = true
    const hostMatched = rule.hostnames.some((h) => matchHostname(url.hostname, h))
    if (!hostMatched) return false
  }

  if (rule.paths && rule.paths.length > 0) {
    hasRuleCriteria = true
    const pathMatched = rule.paths.some((p) => url.pathname === p)
    if (!pathMatched) return false
  }

  if (rule.pathPrefixes && rule.pathPrefixes.length > 0) {
    hasRuleCriteria = true
    const prefixMatched = rule.pathPrefixes.some((p) => url.pathname.startsWith(p))
    if (!prefixMatched) return false
  }

  return hasRuleCriteria
}

/**
 * Classifies a resolved navigation URL into 'internal', 'auth', or 'external'.
 * Uses strict hostname and path parsing - no generic substring search.
 */
export function classifyNavigation(
  resolvedUrlStr: string,
  config: PortalConfig,
  globalAuthRules: PortalAuthRule[] = []
): NavigationKind {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(resolvedUrlStr)
  } catch {
    return 'external'
  }

  // 1. Check portal-specific and global auth rules
  const portalAuthRules = config.navigation?.auth?.rules || []
  const allAuthRules = [...portalAuthRules, ...globalAuthRules]

  const isAuthMatch = allAuthRules.some((rule) => matchesAuthRule(parsedUrl, rule))
  if (isAuthMatch) {
    return 'auth'
  }

  // 2. Check if host belongs to portal's configured domains
  const isInternal = config.domains.some((domain) => matchHostname(parsedUrl.hostname, domain))
  if (isInternal) {
    return 'internal'
  }

  // 3. Otherwise, classify as external
  return 'external'
}

/**
 * Resolves the navigation policy for a classified navigation kind.
 */
export function resolveNavigationPolicy(
  kind: NavigationKind,
  config?: PortalNavigationConfig,
  globalBehavior?: 'controlled' | 'system'
): NavigationPolicy {
  if (kind === 'internal') {
    return { type: 'internal' }
  }

  if (kind === 'auth') {
    return { type: 'auth' }
  }

  const behavior = globalBehavior || config?.external?.behavior || 'system'
  if (behavior === 'system') {
    return { type: 'external_system' }
  }

  return { type: 'external_controlled' }
}
