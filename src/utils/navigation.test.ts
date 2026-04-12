import { describe, expect, it } from 'vitest'
import {
  normalizeAppPath,
  resolveInitialEntryRedirectPath,
  resolveSmartBackFallbackPath,
} from './navigation'

describe('navigation helpers', () => {
  it('normalizes duplicate and trailing slashes', () => {
    expect(normalizeAppPath('//vote//123//')).toBe('/vote/123')
    expect(normalizeAppPath('/')).toBe('/')
  })

  it('redirects only root entry paths to the vote home', () => {
    expect(resolveInitialEntryRedirectPath('/', '/')).toBe('/vote')
    expect(resolveInitialEntryRedirectPath('/vote/', '/')).toBe('/vote')
    expect(resolveInitialEntryRedirectPath('/vote/', '/vote')).toBeNull()
    expect(resolveInitialEntryRedirectPath('/vote/', '/vote/123')).toBeNull()
    expect(resolveInitialEntryRedirectPath('/vote/', '/verification')).toBeNull()
  })

  it('resolves logical parent routes for detail and host subpages', () => {
    expect(resolveSmartBackFallbackPath('/vote/123/live')).toBe('/vote/123')
    expect(resolveSmartBackFallbackPath('/vote/123/result')).toBe('/vote/123')
    expect(resolveSmartBackFallbackPath('/vote/123')).toBe('/vote')
    expect(resolveSmartBackFallbackPath('/host/123/live')).toBe('/host/manage/123')
    expect(resolveSmartBackFallbackPath('/host/123/result')).toBe('/host/manage/123')
    expect(resolveSmartBackFallbackPath('/host/edit/123')).toBe('/host/manage/123')
    expect(resolveSmartBackFallbackPath('/host/manage/123')).toBe('/host')
    expect(resolveSmartBackFallbackPath('/mypage')).toBe('/vote')
  })
})
