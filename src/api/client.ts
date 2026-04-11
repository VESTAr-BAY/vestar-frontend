const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

function resolveHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers)

  if (typeof init?.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
}

export class ApiError extends Error {
  public readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function isApiConfigured(): boolean {
  return BASE_URL.length > 0
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(0, 'VITE_API_BASE_URL is not configured')
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: resolveHeaders(init),
  })

  if (!res.ok) {
    const rawBody = await res.text()

    try {
      const parsed = JSON.parse(rawBody) as {
        message?: string | string[]
        error?: string
      }

      const message = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message
      throw new ApiError(res.status, message ?? parsed.error ?? `API ${res.status}: ${path}`)
    } catch {
      throw new ApiError(res.status, rawBody || `API ${res.status}: ${path}`)
    }
  }

  if (res.status === 204 || res.headers.get('Content-Length') === '0') {
    return null as T
  }

  const rawBody = await res.text()
  if (!rawBody.trim()) {
    return null as T
  }

  return JSON.parse(rawBody) as T
}
