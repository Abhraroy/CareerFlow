import { PortalConfig, PortalAuthRule } from './PortalTypes'

export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'

export const DEFAULT_AUTH_RULES: PortalAuthRule[] = [
  { hostnames: ['accounts.google.com'] },
  { hostnames: ['google.com'], pathPrefixes: ['/gsi/'] },
  { hostnames: ['linkedin.com'], pathPrefixes: ['/oauth', '/uas/login', '/checkpoint/'] },
  { hostnames: ['github.com'], pathPrefixes: ['/login', '/session'] },
  { hostnames: ['appleid.apple.com'] },
  { hostnames: ['facebook.com'], pathPrefixes: ['/v', '/dialog/oauth'] }
]

export const PORTAL_CONFIGS: Record<string, PortalConfig> = {
  linkedin: {
    defaultUrl: 'https://www.linkedin.com/jobs',
    domains: ['linkedin.com'],
    navigation: {
      wrappers: [
        {
          match: {
            paths: ['/safety/go/', '/safety/go']
          },
          destination: {
            queryParam: 'url'
          }
        }
      ],
      external: {
        behavior: 'controlled'
      }
    }
  },
  naukri: { defaultUrl: 'https://www.naukri.com/mnjuser/recommendedjobs', domains: ['naukri.com'] },
  wellfound: { defaultUrl: 'https://wellfound.com/jobs', domains: ['wellfound.com', 'angel.co'] },
  yc: { defaultUrl: 'https://www.ycombinator.com/jobs', domains: ['ycombinator.com'] },
  greenhouse: { defaultUrl: 'https://my.greenhouse.io/jobs', domains: ['greenhouse.io'] },
  angel: { defaultUrl: 'https://angel.co/jobs', domains: ['angel.co', 'wellfound.com'] },
  indeed: { defaultUrl: 'https://www.indeed.com/jobs', domains: ['indeed.com'] },
  glassdoor: { defaultUrl: 'https://www.glassdoor.com/jobs', domains: ['glassdoor.com'] },
  dice: { defaultUrl: 'https://www.dice.com/jobs', domains: ['dice.com'] },
  monster: { defaultUrl: 'https://www.monster.com/jobs', domains: ['monster.com'] },
  careereal: { defaultUrl: 'https://careerealism.com/jobs', domains: ['careerealism.com'] }
}

export function getPortalConfig(portalId: string): PortalConfig {
  if (PORTAL_CONFIGS[portalId]) {
    return PORTAL_CONFIGS[portalId]
  }

  const cleanId = portalId.toLowerCase().trim()
  return {
    defaultUrl: `https://www.${cleanId}.com`,
    domains: [`${cleanId}.com`]
  }
}

