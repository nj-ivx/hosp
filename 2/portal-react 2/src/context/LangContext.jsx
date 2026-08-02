import { createContext, useContext, useEffect, useState } from 'react'
import { I18N, getStoredLang, setStoredLang } from '../lib/i18n'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(getStoredLang())

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    setStoredLang(lang)
  }, [lang])

  const toggleLang = () => setLang((l) => (l === 'ar' ? 'en' : 'ar'))
  const dict = I18N[lang] || I18N.en

  return (
    <LangContext.Provider value={{ lang, toggleLang, t: dict }}>
      {children}
    </LangContext.Provider>
  )
}

/** t is the current dictionary; use t.some_key directly. */
export function useLang() {
  return useContext(LangContext)
}
