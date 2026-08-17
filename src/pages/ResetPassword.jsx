import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'

export default function ResetPassword() {
  const { t } = useLang()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters', 'warning')
      return
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'warning')
      return
    }

    try {
      setSubmitting(true)
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      showToast(t('authSuccessPasswordUpdated'), 'success')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Update password error:', err)
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', width: '100%' }}>
      <div className="glass-card" style={{ padding: '2.25rem 2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
          {t('setNewPasswordTitle')}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
          Choose a new password for your account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('newPasswordPlaceholder')} *</label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password *</label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '1.25rem' }}
          >
            {submitting ? t('processing') : t('updatePasswordBtn')}
          </button>
        </form>
      </div>
    </div>
  )
}
