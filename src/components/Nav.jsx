import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import Logo from './Logo'
import VitalLine from './VitalLine'

export default function Nav() {
  const { user, role, signOut } = useAuth()
  const { lang, toggleLang, t } = useLang()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
    setMobileMenuOpen(false)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const navLinks = [
    { label: t('navHome'), path: '/', show: true },
    { label: t('navDashboard'), path: '/dashboard', show: !!user },
    { label: t('navIntake'), path: '/intake', show: !!user && (role === 'user' || role === 'admin') },
    { label: t('navBook'), path: '/book', show: !!user && (role === 'user' || role === 'admin') },
    { label: t('navNearest'), path: '/nearest', show: true },
    { label: t('navAskAI'), path: '/ask-ai', show: true },
    { label: t('navAdminUsers'), path: '/admin/users', show: !!user && role === 'admin' }
  ].filter(l => l.show)

  const getRoleBadgeLabel = () => {
    switch (role) {
      case 'admin': return t('roleAdmin')
      case 'doctor': return t('roleDoctor')
      case 'hospital': return t('roleHospital')
      default: return t('roleUser')
    }
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 500,
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'var(--transition)'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        {/* Brand Logo */}
        <Logo size="md" />

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => {
            const active = isActive(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  transition: 'var(--transition)'
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Controls: Lang, Theme, User Chip / Auth Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}
        >
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="btn btn-sm btn-secondary"
            title="Switch Language (English / العربية)"
            style={{
              padding: '0.35rem 0.65rem',
              fontWeight: 700,
              fontSize: '0.8rem',
              fontFamily: lang === 'en' ? 'var(--font-arabic)' : 'var(--font-sans)'
            }}
          >
            {lang === 'en' ? 'العربية' : 'English'}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="btn btn-sm btn-secondary"
            title="Toggle Light / Dark Mode"
            style={{ padding: '0.35rem 0.65rem' }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* User Auth Info / Actions */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem'
                }}
                className="desktop-only"
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: role === 'admin' ? '#EC4899' :
                                role === 'doctor' ? '#3B82F6' :
                                role === 'hospital' ? '#F59E0B' : '#10B981'
                  }}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {getRoleBadgeLabel()}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="btn btn-sm btn-danger desktop-only"
              >
                {t('navSignOut')}
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="btn btn-sm btn-primary desktop-only"
            >
              {t('navSignIn')}
            </Link>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="btn btn-sm btn-secondary mobile-only"
            aria-label="Toggle menu"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Heartbeat ECG Divider */}
      <VitalLine />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
          className="mobile-drawer"
        >
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                marginBottom: '0.5rem'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {user.email}
              </span>
              <span className="badge badge-primary">{getRoleBadgeLabel()}</span>
            </div>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: isActive(link.path) ? 700 : 500,
                color: isActive(link.path) ? 'var(--accent)' : 'var(--text-primary)',
                background: isActive(link.path) ? 'var(--accent-soft)' : 'transparent'
              }}
            >
              {link.label}
            </Link>
          ))}

          <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            {user ? (
              <button
                onClick={handleSignOut}
                className="btn btn-danger"
                style={{ width: '100%' }}
              >
                {t('navSignOut')}
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {t('navSignIn')}
              </Link>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 860px) {
          .mobile-only { display: none !important; }
        }
        @media (max-width: 859px) {
          .desktop-nav { display: none !important; }
          .desktop-only { display: none !important; }
        }
      `}</style>
    </header>
  )
}
