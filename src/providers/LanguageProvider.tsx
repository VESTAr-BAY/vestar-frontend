import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getStr, type Lang, type StringKey } from '../i18n'
import { LANGUAGE_STORAGE_KEY, resolveStoredLanguage } from '../utils/language'

interface LanguageContextValue {
  lang: Lang
  toggleLang: () => void
  t: (key: StringKey) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  toggleLang: () => {},
  t: (key) => getStr(key, 'en'),
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(resolveStoredLanguage)

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'ko' : 'en'))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  }, [lang])

  const t = useCallback((key: StringKey) => getStr(key, lang), [lang])

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
