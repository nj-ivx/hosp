import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Nav from '../components/Nav'
import VitalLine from '../components/VitalLine'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setAlert({ type: 'success', message: 'Password updated. Redirecting…' })
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Could not update password. The reset link may have expired — request a new one.' })
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
            <h1>Set a new password</h1>
          </div>
          {alert && <div className={`alert alert-${alert.type}`} role="alert">{alert.message}</div>}
          <form className="stack" onSubmit={handleSubmit}>
            <div className="field">
              <label>New password</label>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
