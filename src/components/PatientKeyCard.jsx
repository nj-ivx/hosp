import React, { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'

export default function PatientKeyCard({ patientKey, patientName, email }) {
  const { t } = useLang()
  const { showToast } = useToast()
  const svgRef = useRef(null)
  const [copied, setCopied] = useState(false)

  const effectiveKey = patientKey || 'FERAS-000'

  useEffect(() => {
    if (svgRef.current && effectiveKey) {
      try {
        JsBarcode(svgRef.current, effectiveKey, {
          format: 'CODE128',
          lineColor: '#0F172A',
          width: 2,
          height: 54,
          displayValue: true,
          font: 'JetBrains Mono, monospace',
          fontSize: 14,
          textMargin: 6,
          background: '#FFFFFF'
        })
      } catch (err) {
        console.warn('JsBarcode rendering error:', err)
      }
    }
  }, [effectiveKey])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(effectiveKey)
    setCopied(true)
    showToast(t('copyKeySuccess'), 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      className="glass-card printable-card"
      style={{
        padding: '1.75rem',
        background: 'linear-gradient(135deg, rgba(11, 93, 102, 0.08), rgba(28, 154, 128, 0.12))',
        border: '1.5px solid var(--accent)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.2rem'
            }}
          >
            {t('brandName')} • {t('patientKeyTitle')}
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            {patientName || t('roleUser')}
          </h3>
          {email && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {email}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent)',
            color: '#FFFFFF',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.04em'
          }}
        >
          VERIFIED PATIENT
        </div>
      </div>

      {/* Key Display */}
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('patientKeyLabel')}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--primary)',
              letterSpacing: '0.12em'
            }}
          >
            {effectiveKey}
          </div>
        </div>

        <button
          onClick={copyToClipboard}
          className="btn btn-sm btn-secondary no-print"
          title="Copy Patient Key"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      {/* Barcode Section */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #E2E8F0',
          marginBottom: '1.25rem',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
        }}
      >
        <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }} />
      </div>

      {/* Footer Info & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {t('patientKeySubtitle')}
        </span>

        <button
          onClick={handlePrint}
          className="btn btn-sm btn-primary no-print"
          style={{ gap: '0.4rem' }}
        >
          🖨️ {t('print')}
        </button>
      </div>
    </div>
  )
}
