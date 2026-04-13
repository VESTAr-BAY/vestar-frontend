import { describe, expect, it } from 'vitest'
import {
  getPwaBaseUrl,
  isNavigateFallbackInScope,
  NETLIFY_REDIRECT_RULES,
  PWA_MANIFEST,
} from './pwaConfig'

// ── Manifest constants ────────────────────────────────────────────────────────

describe('PWA_MANIFEST', () => {
  it('has correct app name', () => {
    expect(PWA_MANIFEST.name).toBe('VESTAr — K-pop Fan Voting')
    expect(PWA_MANIFEST.short_name).toBe('VESTAr')
  })

  it('uses brand purple as theme color', () => {
    expect(PWA_MANIFEST.theme_color).toBe('#7140FF')
  })

  it('uses dark background color', () => {
    expect(PWA_MANIFEST.background_color).toBe('#090A0B')
  })

  it('runs in standalone display mode', () => {
    expect(PWA_MANIFEST.display).toBe('standalone')
  })

  it('locks orientation to portrait', () => {
    expect(PWA_MANIFEST.orientation).toBe('portrait')
  })

  it('production scope and start_url are under /vote/', () => {
    expect(PWA_MANIFEST.scope_prod).toBe('/vote/')
    expect(PWA_MANIFEST.start_url_prod).toBe('/vote/')
  })
})

// ── Base URL utility ──────────────────────────────────────────────────────────

describe('getPwaBaseUrl', () => {
  it('returns /vote/ for production', () => {
    expect(getPwaBaseUrl(true)).toBe('/vote/')
  })

  it('returns / for development', () => {
    expect(getPwaBaseUrl(false)).toBe('/')
  })
})

// ── Navigate fallback scope check ─────────────────────────────────────────────

describe('isNavigateFallbackInScope', () => {
  it('returns true when fallback is inside the scope', () => {
    expect(isNavigateFallbackInScope('/vote/index.html', '/vote/')).toBe(true)
  })

  it('returns false when fallback is outside the scope', () => {
    expect(isNavigateFallbackInScope('/index.html', '/vote/')).toBe(false)
  })

  it('returns true for root scope (catches everything)', () => {
    expect(isNavigateFallbackInScope('/index.html', '/')).toBe(true)
  })
})

// ── Netlify _redirects rules ──────────────────────────────────────────────────

describe('NETLIFY_REDIRECT_RULES', () => {
  it('has a rule that serves the main app for /vote/* routes', () => {
    const appRule = NETLIFY_REDIRECT_RULES.find((r) => r.startsWith('/vote/*'))
    expect(appRule).toBeDefined()
    expect(appRule).toContain('/vote/index.html')
    expect(appRule).toContain('200')
  })

  it('has a root redirect pointing to /vote', () => {
    const rootRule = NETLIFY_REDIRECT_RULES.find((r) => r.startsWith('/  '))
    expect(rootRule).toBeDefined()
    expect(rootRule).toContain('/vote')
    expect(rootRule).toContain('301')
  })

  it('has a portal rule that does not conflict with main app rule', () => {
    const portalRule = NETLIFY_REDIRECT_RULES.find((r) => r.startsWith('/vote/verification'))
    const appRule = NETLIFY_REDIRECT_RULES.find(
      (r) => r.startsWith('/vote/*') && !r.startsWith('/vote/verification'),
    )
    expect(portalRule).toBeDefined()
    expect(appRule).toBeDefined()
    // portal rule must come before the catch-all /vote/* rule
    const portalIdx = NETLIFY_REDIRECT_RULES.indexOf(
      portalRule as (typeof NETLIFY_REDIRECT_RULES)[number],
    )
    const appIdx = NETLIFY_REDIRECT_RULES.indexOf(
      appRule as (typeof NETLIFY_REDIRECT_RULES)[number],
    )
    expect(portalIdx).toBeLessThan(appIdx)
  })
})
