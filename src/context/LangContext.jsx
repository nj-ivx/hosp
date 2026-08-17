import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../lib/i18n'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('feras_portal_lang') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('feras_portal_lang', lang)
    const dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const toggleLang = () => {
    setLang(prev => (prev === 'en' ? 'ar' : 'en'))
  }

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key
  }

  const isRtl = lang === 'ar'

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t, isRtl }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const context = useContext(LangContext)
  if (!context) {
    throw new Error('useLang must be used within a LangProvider')
  }
  return context
}
