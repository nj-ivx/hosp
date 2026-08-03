import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import Nav from '../components/Nav'
import VitalLine from '../components/VitalLine'
import OverviewPanel from '../components/OverviewPanel'
import HospitalsSection from '../components/HospitalsSection'
import DoctorsSection from '../components/DoctorsSection'

export default function Landing() {
  const { session, loading } = useAuth()
  const { t } = useLang()
  const [hospitals, setHospitals] = useState([])

  if (!loading && session) return <Navigate to="/dashboard" replace />

  return (
    <div className="page">
      <Nav />
      <VitalLine />
      <main className="container">
        <div className="landing-hero">
          <h1>{t.brand}</h1>
          <p>{t.overview_desc}</p>
          <div className="landing-cta">
            <Link className="btn btn-primary" to="/auth">{t.tab_login}</Link>
            <Link className="btn btn-ghost" to="/auth">{t.tab_signup}</Link>
          </div>
        </div>

        <OverviewPanel />
        <HospitalsSection isAdmin={false} onChange={setHospitals} />
        <DoctorsSection isAdmin={false} hospitals={hospitals} />
      </main>
    </div>
  )
}
