import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'

export default function Logo({ size = 'md' }) {
  const { t } = useLang()

  const isSmall = size === 'sm'

  return (
    <Link
      to="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '8px' : '12px',
        textDecoration: 'none',
        color: 'inherit',
        userSelect: 'none'
      }}
    >
      <div
        style={{
          width: isSmall ? '34px' : '42px',
          height: isSmall ? '34px' : '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px var(--accent-glow)',
          flexShrink: 0
        }}
      >
        <svg
          width={isSmall ? "20" : "26"}
          height={isSmall ? "20" : "26"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20M2 12h20" />
        </svg>
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: isSmall ? '1.05rem' : '1.25rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--text-primary)'
          }}
        >
          {t('brandName')}
        </div>
        {!isSmall && (
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 500,
              color: 'var(--accent)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            {t('brandTagline')}
          </div>
        )}
      </div>
    </Link>
  )
}
