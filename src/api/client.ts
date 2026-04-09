const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

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
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
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

  return res.json() as Promise<T>
}
