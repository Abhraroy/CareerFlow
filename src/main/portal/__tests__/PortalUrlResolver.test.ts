import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  matchHostname,
  resolveNavigationUrl,
  classifyNavigation,
  resolveNavigationPolicy
} from '../PortalUrlResolver'
import type { PortalConfig, PortalAuthRule } from '../PortalTypes'

describe('PortalUrlResolver - Domain Matching', () => {
  it('correctly matches domain and subdomains', () => {
    assert.equal(matchHostname('linkedin.com', 'linkedin.com'), true)
    assert.equal(matchHostname('www.linkedin.com', 'linkedin.com'), true)
    assert.equal(matchHostname('jobs.linkedin.com', 'linkedin.com'), true)
    assert.equal(matchHostname('sub.jobs.linkedin.com', 'linkedin.com'), true)
  })

  it('rejects unauthorized or phishing domain variations', () => {
    assert.equal(matchHostname('evil-linkedin.com', 'linkedin.com'), false)
    assert.equal(matchHostname('linkedin.com.evil.com', 'linkedin.com'), false)
    assert.equal(matchHostname('fakelinkedin.com', 'linkedin.com'), false)
    assert.equal(matchHostname('accenture.com', 'linkedin.com'), false)
  })
})

describe('PortalUrlResolver - Wrapper URL Resolution', () => {
  const linkedinConfig = {
    wrappers: [
      {
        match: {
          paths: ['/safety/go/', '/safety/go']
        },
        destination: {
          queryParam: 'url'
        }
      }
    ]
  }

  it('returns normal URLs unchanged', () => {
    const rawUrl = 'https://www.linkedin.com/jobs/view/12345/'
    assert.equal(resolveNavigationUrl(rawUrl, linkedinConfig), rawUrl)
  })

  it('resolves LinkedIn safety redirect wrappers to the actual destination', () => {
    const target = 'https://www.accenture.com/in-en/careers/jobdetails?id=1234'
    const wrapperUrl = `https://www.linkedin.com/safety/go/?url=${encodeURIComponent(target)}`

    assert.equal(resolveNavigationUrl(wrapperUrl, linkedinConfig), target)
  })

  it('handles multi-level (nested) wrappers up to maxDepth', () => {
    const finalDest = 'https://workday.com/job/999'
    const innerWrapper = `https://www.linkedin.com/safety/go/?url=${encodeURIComponent(finalDest)}`
    const outerWrapper = `https://www.linkedin.com/safety/go/?url=${encodeURIComponent(innerWrapper)}`

    assert.equal(resolveNavigationUrl(outerWrapper, linkedinConfig), finalDest)
  })

  it('handles wrapper URLs missing destination query params gracefully', () => {
    const incompleteWrapper = 'https://www.linkedin.com/safety/go/?other=123'
    assert.equal(resolveNavigationUrl(incompleteWrapper, linkedinConfig), incompleteWrapper)
  })

  it('handles malformed URLs gracefully without throwing', () => {
    const malformedUrl = 'not-a-valid-url'
    assert.equal(resolveNavigationUrl(malformedUrl, linkedinConfig), malformedUrl)
  })

  it('prevents infinite loops using maxDepth limit', () => {
    const loopUrl = 'https://www.linkedin.com/safety/go/?url=https%3A%2F%2Fwww.linkedin.com%2Fsafety%2Fgo%2F%3Furl%3Dhttps%253A%252F%252Fwww.linkedin.com%252Fsafety%252Fgo%252F'
    assert.doesNotThrow(() => resolveNavigationUrl(loopUrl, linkedinConfig, 3))
  })
})

describe('PortalUrlResolver - Navigation Classification', () => {
  const portalConfig: PortalConfig = {
    defaultUrl: 'https://www.linkedin.com/jobs',
    domains: ['linkedin.com'],
    navigation: {
      auth: {
        rules: [
          { hostnames: ['linkedin.com'], pathPrefixes: ['/oauth', '/uas/login'] }
        ]
      }
    }
  }

  const globalAuthRules: PortalAuthRule[] = [
    { hostnames: ['accounts.google.com'] },
    { hostnames: ['github.com'], pathPrefixes: ['/login'] }
  ]

  it('classifies internal portal links as "internal"', () => {
    assert.equal(classifyNavigation('https://www.linkedin.com/feed/', portalConfig, globalAuthRules), 'internal')
    assert.equal(classifyNavigation('https://jobs.linkedin.com/search', portalConfig, globalAuthRules), 'internal')
  })

  it('classifies configured auth endpoints as "auth"', () => {
    assert.equal(classifyNavigation('https://accounts.google.com/o/oauth2/auth', portalConfig, globalAuthRules), 'auth')
    assert.equal(classifyNavigation('https://www.linkedin.com/oauth/v2/authorization', portalConfig, globalAuthRules), 'auth')
    assert.equal(classifyNavigation('https://github.com/login/oauth/authorize', portalConfig, globalAuthRules), 'auth')
  })

  it('classifies external destination links as "external"', () => {
    assert.equal(classifyNavigation('https://www.accenture.com/careers', portalConfig, globalAuthRules), 'external')
    assert.equal(classifyNavigation('https://my.greenhouse.io/job/1', portalConfig, globalAuthRules), 'external')
  })
})

describe('PortalUrlResolver - Navigation Policy Resolution', () => {
  it('maps internal kind to "internal" policy regardless of disposition', () => {
    assert.deepEqual(resolveNavigationPolicy('internal'), { type: 'internal' })
  })

  it('maps auth kind to "auth" policy', () => {
    assert.deepEqual(resolveNavigationPolicy('auth'), { type: 'auth' })
  })

  it('maps external kind to "external_system" by default (Chrome/System Browser)', () => {
    assert.deepEqual(resolveNavigationPolicy('external'), { type: 'external_system' })
  })

  it('maps external kind to "external_controlled" when configured as controlled', () => {
    assert.deepEqual(
      resolveNavigationPolicy('external', undefined, 'controlled'),
      { type: 'external_controlled' }
    )
  })
})
