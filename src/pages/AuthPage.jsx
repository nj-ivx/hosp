import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth()
  const { t } = useLang()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      showToast('Please fill all required fields', 'warning')
      return
    }

    try {
      setSubmitting(true)
      if (isLogin) {
        await signIn(email.trim(), password)
        showToast(t('authSuccessLogin'), 'success')
        navigate(from, { replace: true })
      } else {
        await signUp(email.trim(), password, fullName.trim())
        showToast(t('authSuccessSignup'), 'success')
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error('Auth error:', err)
      showToast(err.message || t('authErrorDefault'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: '460px',
        margin: '2rem auto',
        width: '100%',
        animation: 'fadeInScale 0.3s ease-out'
      }}
    >
      <div className="glass-card" style={{ padding: '2.25rem 2rem', boxShadow: 'var(--shadow-lg)' }}>
        {/* Brand Icon & Heading */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              color: '#FFFFFF',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 20px var(--accent-glow)'
            }}
          >
            ✚
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            {isLogin ? t('loginTab') : t('signupTab')}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {t('brandTagline')}
          </p>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '1.75rem'
          }}
        >
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: isLogin ? 700 : 500,
              fontSize: '0.875rem',
              background: isLogin ? 'var(--bg-card)' : 'transparent',
              color: isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: isLogin ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)'
            }}
          >
            {t('loginTab')}
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: !isLogin ? 700 : 500,
              fontSize: '0.875rem',
              background: !isLogin ? 'var(--bg-card)' : 'transparent',
              color: !isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: !isLogin ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)'
            }}
          >
            {t('signupTab')}
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">{t('fullName')} *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Feras Al-Otaibi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

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

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">{t('passwordPlaceholder')} *</label>
              {isLogin && (
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  {t('forgotPasswordLink')}
                </Link>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                className="form-input"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)'
                }}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '1.25rem', fontSize: '0.95rem' }}
          >
            {submitting ? t('processing') : isLogin ? t('signInBtn') : t('signUpBtn')}
          </button>
        </form>

        {/* Footer Note */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
              >
                {t('signupTab')}
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
              >
                {t('loginTab')}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
