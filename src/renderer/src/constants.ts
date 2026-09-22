import { Portal } from './types'

export const getLogo = (url: string): string => {
  try {
    const domain = new URL(url).hostname

    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
  } catch {
    return ''
  }
}

export const PORTALS: Portal[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs',
    logo: getLogo('https://www.linkedin.com')
  },
  {
    id: 'greenhouse',
    label: 'Greenhouse',
    url: 'https://my.greenhouse.io/jobs',
    logo: getLogo('https://greenhouse.io')
  },
  {
    id: 'naukri',
    label: 'Naukri',
    url: 'https://www.naukri.com/',
    logo: getLogo('https://www.naukri.com/')
  },
  {
    id: 'wellfound',
    label: 'Wellfound',
    url: 'https://wellfound.com/jobs',
    logo: getLogo('https://wellfound.com')
  },
  {
    id: 'yc',
    label: 'Y Combinator',
    url: 'https://www.ycombinator.com/jobs',
    logo: getLogo('https://www.ycombinator.com')
  },
  {
    id: 'angel',
    label: 'AngelList',
    url: 'https://angel.co/jobs',
    logo: getLogo('https://angel.co')
  },
  {
    id: 'indeed',
    label: 'Indeed',
    url: 'https://www.indeed.com/jobs',
    logo: getLogo('https://www.indeed.com')
  },
  {
    id: 'glassdoor',
    label: 'Glassdoor',
    url: 'https://www.glassdoor.com/jobs',
    logo: getLogo('https://www.glassdoor.com')
  },
  {
    id: 'dice',
    label: 'Dice',
    url: 'https://www.dice.com/jobs',
    logo: getLogo('https://www.dice.com')
  },
  {
    id: 'monster',
    label: 'Monster',
    url: 'https://www.monster.com/jobs',
    logo: getLogo('https://www.monster.com')
  },
  {
    id: 'careereal',
    label: 'CareerRealism',
    url: 'https://careerealism.com/jobs',
    logo: getLogo('https://careerealism.com')
  }
]
