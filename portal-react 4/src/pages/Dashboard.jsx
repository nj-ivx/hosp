import { useState } from 'react'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import Nav from '../components/Nav'
import VitalLine from '../components/VitalLine'
import OverviewPanel from '../components/OverviewPanel'
import AdminView from '../components/AdminView'
import PatientView from '../components/PatientView'
import HospitalPortal from '../components/HospitalPortal'
import HospitalsSection from '../components/HospitalsSection'
import DoctorsSection from '../components/DoctorsSection'

export default function Dashboard() {
  const { t } = useLang()
  const { session, role } = useAuth()
  const [hospitals, setHospitals] = useState([])

  const isAdmin = role === 'admin'
  const email = session?.user?.email || ''

  const subGreeting = isAdmin ? t.sub_admin
    : role === 'hospital' ? 'Manage your doctors and look up patient records.'
    : t.sub_patient

  return (
    <div className="page">
      <Nav showRoleBadge />
      <VitalLine />
      <main className="container">
        <div className="hero">
          <h1>{t.greeting_default}{email ? `, ${email.split('@')[0]}` : ''}</h1>
          <p className="muted">{subGreeting}</p>
        </div>

        {role !== 'hospital' && (
          <div className="action-grid" style={{ marginBottom: 24 }}>
            <a className="card action-card" href="#/nearest" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="icon">📍</span>
              <h3>Find Nearest Specialist</h3>
              <p>Search doctors by distance from you</p>
            </a>
            <a className="card action-card" href="#/ask-ai" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="icon">💬</span>
              <h3>Ask AI</h3>
              <p>Get help navigating the portal or general questions</p>
            </a>
          </div>
        )}

        <OverviewPanel />

        {role === 'admin' && <AdminView />}
        {role === 'user' && <PatientView />}
        {role === 'hospital' && <HospitalPortal />}
        {role !== 'admin' && role !== 'user' && role !== 'hospital' && (
          <div className="alert alert-error" role="alert">
            No access role is set up for this account yet. Contact an administrator.
          </div>
        )}

        {role !== 'hospital' && (
          <>
            <HospitalsSection isAdmin={isAdmin} onChange={setHospitals} />
            <DoctorsSection isAdmin={isAdmin} hospitals={hospitals} />
          </>
        )}
      </main>
    </div>
  )
}
