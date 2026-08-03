import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Nav from '../components/Nav'
import VitalLine from '../components/VitalLine'

export default function AuthPage() {
  const { t } = useLang()
  const { session, loading } = useAuth()
  const [tab, setTab] = useState('login')
  const [alert, setAlert] = useState(null) // { type, message }
  const [busy, setBusy] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [suFirst, setSuFirst] = useState('')
  const [suLast, setSuLast] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPassword, setSuPassword] = useState('')

  useTheme() // ensure theme attr applied even before Nav mounts fully

  if (!loading && session) return <Navigate to="/dashboard" replace />

  async function handleLogin(e) {
    e.preventDefault()
    setAlert(null)
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
      if (error) throw error
      // redirect handled by session state change above
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Login failed. Check your credentials and try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    setAlert(null)
    setBusy(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: suEmail,
        password: suPassword,
        options: { data: { first_name: suFirst, last_name: suLast } },
      })
      if (error) throw error

      // user_roles row is created server-side by a Postgres trigger on auth.users

      if (!data.session) {
        setAlert({ type: 'success', message: 'Account created. Check your email to confirm before logging in.' })
        setTab('login')
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Sign up failed. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <Nav />
      <VitalLine />
      <main className="auth-shell">
        <div className="card-float auth-card">
          <div className="auth-head">
            <h1>{t.welcome}</h1>
            <p className="muted">{t.signin_sub}</p>
          </div>

          <div className="tabs">
            <div className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setAlert(null) }}>{t.tab_login}</div>
            <div className={`tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setAlert(null) }}>{t.tab_signup}</div>
          </div>

          {alert && (
            <div className={`alert alert-${alert.type}`} role="alert">{alert.message}</div>
          )}

          {tab === 'login' && (
            <form className="stack" onSubmit={handleLogin}>
              <div className="field">
                <label>{t.label_email}</label>
                <input type="email" required autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              </div>
              <div className="field">
                <label>{t.label_password}</label>
                <input type="password" required autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? 'Please wait…' : t.btn_login}
              </button>
              <p className="fine-print" style={{ marginTop: 4 }}>
                <Link to="/forgot-password">Forgot your password?</Link>
              </p>
            </form>
          )}

          {tab === 'signup' && (
            <form className="stack" onSubmit={handleSignup}>
              <div className="grid-2">
                <div className="field">
                  <label>{t.label_first_name}</label>
                  <input type="text" required autoComplete="given-name" value={suFirst} onChange={(e) => setSuFirst(e.target.value)} />
                </div>
                <div className="field">
                  <label>{t.label_last_name}</label>
                  <input type="text" required autoComplete="family-name" value={suLast} onChange={(e) => setSuLast(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>{t.label_email}</label>
                <input type="email" required autoComplete="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} />
              </div>
              <div className="field">
                <label>{t.label_password}</label>
                <input type="password" required minLength={8} autoComplete="new-password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? 'Please wait…' : t.btn_signup}
              </button>
            </form>
          )}

          <p className="fine-print muted">{t.signup_fineprint}</p>
        </div>
      </main>
    </div>
  )
}
