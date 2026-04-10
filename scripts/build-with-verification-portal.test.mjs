// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  PORTAL_REDIRECT_RULE,
  SPA_REDIRECT_RULE,
  syncRedirects,
} from './build-with-verification-portal.mjs'

describe('redirect rule constants', () => {
  it('portal rule targets verification index', () => {
    expect(PORTAL_REDIRECT_RULE).toBe('/vote/verification/* /vote/verification/index.html  200')
  })

  it('SPA rule targets vote index', () => {
    expect(SPA_REDIRECT_RULE).toBe('/vote/*  /vote/index.html  200')
  })

  it('portal rule is more specific than SPA rule (must come first)', () => {
    // Netlify evaluates rules top-to-bottom; the portal rule must precede the SPA wildcard
    const rules = [PORTAL_REDIRECT_RULE, SPA_REDIRECT_RULE]
    const portalIdx = rules.indexOf(PORTAL_REDIRECT_RULE)
    const spaIdx = rules.indexOf(SPA_REDIRECT_RULE)
    expect(portalIdx).toBeLessThan(spaIdx)
  })
})

describe('syncRedirects', () => {
  let tmpDir
  let redirectsFile

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'vestar-test-'))
    redirectsFile = path.join(tmpDir, '_redirects')
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('creates _redirects with pinned rules when file does not exist', async () => {
    await syncRedirects(redirectsFile, [PORTAL_REDIRECT_RULE, SPA_REDIRECT_RULE])

    const content = await readFile(redirectsFile, 'utf8')
    const lines = content.split('\n').filter(Boolean)

    expect(lines[0]).toBe(PORTAL_REDIRECT_RULE)
    expect(lines[1]).toBe(SPA_REDIRECT_RULE)
  })

  it('pinned rules appear before any pre-existing rules', async () => {
    await writeFile(redirectsFile, '/old-rule /old-target 301\n')

    await syncRedirects(redirectsFile, [PORTAL_REDIRECT_RULE, SPA_REDIRECT_RULE])

    const content = await readFile(redirectsFile, 'utf8')
    const lines = content.split('\n').filter(Boolean)

    expect(lines[0]).toBe(PORTAL_REDIRECT_RULE)
    expect(lines[1]).toBe(SPA_REDIRECT_RULE)
    expect(lines[2]).toBe('/old-rule /old-target 301')
  })

  it('does not duplicate pinned rules on repeated runs', async () => {
    // First run
    await syncRedirects(redirectsFile, [PORTAL_REDIRECT_RULE, SPA_REDIRECT_RULE])
    // Second run (idempotent)
    await syncRedirects(redirectsFile, [PORTAL_REDIRECT_RULE, SPA_REDIRECT_RULE])

    const content = await readFile(redirectsFile, 'utf8')
    const lines = content.split('\n').filter(Boolean)

    const portalCount = lines.filter((l) => l === PORTAL_REDIRECT_RULE).length
    const spaCount = lines.filter((l) => l === SPA_REDIRECT_RULE).length

    expect(portalCount).toBe(1)
    expect(spaCount).toBe(1)
  })

  it('preserves non-pinned custom rules across repeated runs', async () => {
    const customRule = '/custom/* /custom/index.html 200'
    await writeFile(redirectsFile, `${customRule}\n`)

    await syncRedirects(redirectsFile, [PORTAL_REDIRECT_RULE, SPA_REDIRECT_RULE])

    const content = await readFile(redirectsFile, 'utf8')
    expect(content).toContain(customRule)
  })

  it('file ends with a newline', async () => {
    await syncRedirects(redirectsFile, [PORTAL_REDIRECT_RULE, SPA_REDIRECT_RULE])

    const content = await readFile(redirectsFile, 'utf8')
    expect(content.endsWith('\n')).toBe(true)
  })

  it('handles empty existing file without throwing', async () => {
    await writeFile(redirectsFile, '')

    await expect(
      syncRedirects(redirectsFile, [PORTAL_REDIRECT_RULE, SPA_REDIRECT_RULE]),
    ).resolves.not.toThrow()

    const content = await readFile(redirectsFile, 'utf8')
    expect(content).toContain(PORTAL_REDIRECT_RULE)
    expect(content).toContain(SPA_REDIRECT_RULE)
  })

  it('handles Windows-style CRLF line endings in existing file', async () => {
    const customRule = '/legacy /new 301'
    await writeFile(redirectsFile, `${customRule}\r\n`)

    await syncRedirects(redirectsFile, [PORTAL_REDIRECT_RULE, SPA_REDIRECT_RULE])

    const content = await readFile(redirectsFile, 'utf8')
    const lines = content.split('\n').filter(Boolean)

    expect(lines).toContain(customRule)
  })
})
