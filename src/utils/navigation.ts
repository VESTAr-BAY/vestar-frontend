export function normalizeAppPath(path: string) {
  const normalized = path.replace(/\/{2,}/g, '/')

  if (!normalized) {
    return '/'
  }

  return normalized.length > 1 && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

export function resolveInitialEntryRedirectPath(basePath: string, currentPath: string) {
  const normalizedCurrentPath = normalizeAppPath(currentPath)
  const normalizedBasePath = normalizeAppPath(basePath || '/')
  const voteHomePath = '/vote'

  if (normalizedCurrentPath === voteHomePath) {
    return null
  }

  if (normalizedCurrentPath === '/' || normalizedCurrentPath === normalizedBasePath) {
    return voteHomePath
  }

  return null
}

export function resolveSmartBackFallbackPath(pathname: string) {
  const normalizedPath = normalizeAppPath(pathname)
  const voteChildMatch = normalizedPath.match(/^\/vote\/([^/]+)\/(live|result)$/)

  if (voteChildMatch) {
    return `/vote/${voteChildMatch[1]}`
  }

  if (/^\/vote\/[^/]+$/.test(normalizedPath)) {
    return '/vote'
  }

  const hostChildMatch = normalizedPath.match(/^\/host\/([^/]+)\/(live|result|settlement)$/)

  if (hostChildMatch) {
    return `/host/manage/${hostChildMatch[1]}`
  }

  const hostEditMatch = normalizedPath.match(/^\/host\/edit\/([^/]+)$/)

  if (hostEditMatch) {
    return `/host/manage/${hostEditMatch[1]}`
  }

  if (/^\/host\/manage\/[^/]+$/.test(normalizedPath)) {
    return '/host'
  }

  if (normalizedPath.startsWith('/host')) {
    return '/host'
  }

  return '/vote'
}
