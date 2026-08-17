import React from 'react'
import { useLang } from '../context/LangContext'

export default function OverviewPanel() {
  const { t } = useLang()

  const features = [
    {
      icon: '🪪',
      title: t('landingFeature1Title'),
      desc: t('landingFeature1Desc')
    },
    {
      icon: '📍',
      title: t('landingFeature2Title'),
      desc: t('landingFeature2Desc')
    },
    {
      icon: '🩺',
      title: t('landingFeature3Title'),
      desc: t('landingFeature3Desc')
    }
  ]

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.75rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--bg-card-glass), var(--bg-card))',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {features.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start'
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0
              }}
            >
              {item.icon}
            </div>
            <div>
              <h4
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  marginBottom: '0.35rem',
                  color: 'var(--text-primary)'
                }}
              >
                {item.title}
              </h4>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}
              >
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
