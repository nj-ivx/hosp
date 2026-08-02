import { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import Nav from '../components/Nav'
import VitalLine from '../components/VitalLine'
import OverviewPanel from '../components/OverviewPanel'
import AdminView from '../components/AdminView'
import PatientView from '../components/PatientView'
import HospitalsSection from '../components/HospitalsSection'
import DoctorsSection from '../components/DoctorsSection'

export default function Dashboard() {
  const { t } = useLang()
  const { session, role } = useAuth()
  const [hospitals, setHospitals] = useState([])

  const isAdmin = role === 'admin'
  const email = session?.user?.email || ''

  return (
    <div className="page">
      <Nav showRoleBadge />
      <VitalLine />
      <main className="container">
        <div className="hero">
          <h1>{t.greeting_default}{email ? `, ${email.split('@')[0]}` : ''}</h1>
          <p className="muted">{isAdmin ? t.sub_admin : t.sub_patient}</p>
        </div>

        <OverviewPanel />

        {role === 'admin' && <AdminView />}
        {role === 'user' && <PatientView />}
        {role !== 'admin' && role !== 'user' && (
          <div className="alert alert-error" role="alert">
            No access role is set up for this account yet. Contact an administrator.
          </div>
        )}

        <HospitalsSection isAdmin={isAdmin} onChange={setHospitals} />
        <DoctorsSection isAdmin={isAdmin} hospitals={hospitals} />
      </main>
    </div>
  )
}
