import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function PatientKeyCard() {
  const { patientKey } = useAuth()
  const { showToast } = useToast()

  if (!patientKey) return null

  function copyKey() {
    navigator.clipboard.writeText(patientKey)
    showToast('Key copied to clipboard.')
  }

  return (
    <div className="card-float" style={{ padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', fontWeight: 600, marginBottom: 4 }}>YOUR PATIENT KEY</div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em' }}>{patientKey}</div>
        <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0', maxWidth: 420 }}>
          Share this key with hospital staff so they can pull up your records when you visit.
        </p>
      </div>
      <button className="btn btn-ghost" onClick={copyKey}>Copy</button>
    </div>
  )
}
