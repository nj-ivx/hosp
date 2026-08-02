import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen">
          <div className="spinner" />
          <span>Verifying your session…</span>
          <div style={{ width: 280, marginTop: 20 }}>
            <div className="skeleton skeleton-bar" style={{ width: '60%' }} />
            <div className="skeleton skeleton-bar" style={{ width: '90%' }} />
            <div className="skeleton skeleton-card" style={{ marginTop: 12 }} />
          </div>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />
  return children
}
