import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Nav({ showRoleBadge = false }) {
  const { toggleTheme } = useTheme()
  const { lang, toggleLang, t } = useLang()
  const { role, signOut } = useAuth()

  return (
    <nav className="navbar">
      <div className="container">
        <div className="brand">
          <Logo />
          <span>{t.brand}</span>
        </div>
        <div className="nav-actions">
          {showRoleBadge && role && (
            <span className={`badge ${role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
              {role === 'admin' ? t.badge_admin : t.badge_patient}
            </span>
          )}
          <button className="lang-toggle" onClick={toggleLang}>{lang === 'ar' ? 'EN' : 'AR'}</button>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode" />
          {showRoleBadge && (
            <button className="btn btn-ghost" onClick={signOut}>{t.logout}</button>
          )}
        </div>
      </div>
    </nav>
  )
}
