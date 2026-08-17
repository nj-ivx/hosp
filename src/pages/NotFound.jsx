import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'

export default function NotFound() {
  const { t } = useLang()

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '5rem 1.5rem',
        maxWidth: '500px',
        margin: '0 auto'
      }}
    >
      <div
        style={{
          fontSize: '4.5rem',
          fontWeight: 900,
          color: 'var(--primary-light)',
          lineHeight: 1,
          marginBottom: '1rem',
          fontFamily: 'var(--font-heading)'
        }}
      >
        404
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
        The requested medical resource or route could not be located.
      </p>
      <Link to="/" className="btn btn-primary btn-lg">
        {t('navHome')}
      </Link>
    </div>
  )
}
