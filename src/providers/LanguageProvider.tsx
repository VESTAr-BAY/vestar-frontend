import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { getStr, type Lang, type StringKey } from '../i18n'

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
  const [lang, setLang] = useState<Lang>('en')

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'ko' : 'en'))
  }, [])

  const t = useCallback((key: StringKey) => getStr(key, lang), [lang])

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
