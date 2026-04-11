import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('apiFetch', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not add a content-type header for bodyless GET requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const { apiFetch } = await import('./client')

    await apiFetch('/elections')

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    const headers = new Headers(requestInit.headers)

    expect(headers.has('Content-Type')).toBe(false)
  })

  it('adds a json content-type header when sending a string body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const { apiFetch } = await import('./client')

    await apiFetch('/private-elections/prepare', {
      method: 'POST',
      body: JSON.stringify({ hello: 'world' }),
    })

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    const headers = new Headers(requestInit.headers)

    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('returns null for successful empty responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 200,
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const { apiFetch } = await import('./client')

    await expect(apiFetch('/verified-organizers/request-status')).resolves.toBeNull()
  })
})
