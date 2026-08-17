import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'

export default function ForgotPassword() {
  const { t } = useLang()
  const { showToast } = useToast()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    try {
      setSubmitting(true)
      const redirectUrl = `${window.location.origin}${window.location.pathname}#/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl
      })

      if (error) throw error

      setSent(true)
      showToast(t('authSuccessResetSent'), 'success')
    } catch (err) {
      console.error('Password reset error:', err)
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', width: '100%' }}>
      <div className="glass-card" style={{ padding: '2.25rem 2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
          {t('resetPasswordTitle')}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
          {t('resetPasswordSubtitle')}
        </p>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✉️</div>
            <p style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '1.5rem' }}>
              {t('authSuccessResetSent')}
            </p>
            <Link to="/auth" className="btn btn-primary" style={{ width: '100%' }}>
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('email')} *</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '1rem' }}
            >
              {submitting ? t('processing') : t('sendResetLinkBtn')}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <Link to="/auth" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                ← {t('backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
