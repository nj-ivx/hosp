import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import VitalLine from '../components/VitalLine'

export default function AskAI() {
  function openChat() {
    if (window.chatbase && typeof window.chatbase === 'function') {
      window.chatbase('open')
    }
  }

  return (
    <div className="page">
      <Nav showRoleBadge />
      <VitalLine />
      <main className="container form-shell">
        <Link className="back-link" to="/dashboard">← Back to dashboard</Link>

        <div className="form-head center">
          <h1>Ask AI</h1>
          <p className="muted">Get quick answers about using the portal, general health topics, or where to go next.</p>
        </div>

        <div className="card-form card" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>💬</span>
          <p style={{ marginBottom: 20 }}>
            Tap the chat bubble in the bottom corner any time, or click below to open it now.
          </p>
          <button className="btn btn-primary" onClick={openChat}>Open AI Assistant</button>

          <div className="alert alert-warning" style={{ marginTop: 24, textAlign: 'left' }}>
            This assistant can help you navigate the portal and answer general questions,
            but it is not a substitute for professional medical advice. For symptoms,
            diagnosis, or treatment decisions, please book an appointment with one of our
            doctors or contact emergency services if it's urgent.
          </div>
        </div>
      </main>
    </div>
  )
}
