import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Nav from '../components/Nav'
import VitalLine from '../components/VitalLine'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    setBusy(true)
    try {
      const redirectTo = `${window.location.origin}${window.location.pathname}#/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw error
      setAlert({ type: 'success', message: 'Check your email for a password reset link.' })
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Could not send reset email. Please try again.' })
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
            <h1>Reset Password</h1>
            <p className="muted">We'll email you a link to set a new password.</p>
          </div>
          {alert && <div className={`alert alert-${alert.type}`} role="alert">{alert.message}</div>}
          <form className="stack" onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p className="fine-print muted"><Link to="/auth">Back to login</Link></p>
        </div>
      </main>
    </div>
  )
}
