import type { Lang } from '../i18n'

export const LANGUAGE_STORAGE_KEY = 'vestar_lang'

export function resolveStoredLanguage(): Lang {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'ko' || stored === 'en') {
    return stored
  }

  return window.navigator.language.toLowerCase().startsWith('ko') ? 'ko' : 'en'
}
