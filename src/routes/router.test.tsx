import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Regression: vercel.json was rewriting all requests to /index.html, but the
 * built file lives at /vote/index.html (Vite base = '/vote/').
 * Refreshing any page other than the root returned a Vercel 404.
 */
describe('vercel.json — SPA rewrite destination', () => {
  const vercelConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8')) as {
    rewrites?: { source: string; destination: string }[]
  }

  it('rewrites all paths to /vote/index.html (not /index.html)', () => {
    const rewrites = vercelConfig.rewrites ?? []
    expect(rewrites.length).toBeGreaterThan(0)

    const destinations = rewrites.map((r) => r.destination)
    // Every rewrite destination must point to the built index inside /vote/
    for (const dest of destinations) {
      expect(dest).toBe('/vote/index.html')
    }
  })

  it('catch-all source covers all paths', () => {
    const rewrites = vercelConfig.rewrites ?? []
    // At least one rewrite should be a catch-all (covers any path)
    const hasCatchAll = rewrites.some((r) => r.source === '/(.*)')
    expect(hasCatchAll).toBe(true)
  })
})
