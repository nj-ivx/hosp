import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import OverviewPanel from '../components/OverviewPanel'

export default function Landing() {
  const { user } = useAuth()
  const { t } = useLang()

  const [hospitals, setHospitals] = useState([])
  const [doctors, setDoctors] = useState([])
  const [stats, setStats] = useState({ hospitals: 0, doctors: 0, appointments: 0 })

  useEffect(() => {
    async function loadLandingData() {
      try {
        const { data: hospData } = await supabase
          .from('hospitals')
          .select('*')
          .limit(4)

        const { data: docData } = await supabase
          .from('doctors')
          .select('*, hospitals(name)')
          .limit(6)

        const { count: hospCount } = await supabase.from('hospitals').select('*', { count: 'exact', head: true })
        const { count: docCount } = await supabase.from('doctors').select('*', { count: 'exact', head: true })
        const { count: appCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true })

        setHospitals(hospData || [])
        setDoctors(docData || [])
        setStats({
          hospitals: hospCount || 8,
          doctors: docCount || 24,
          appointments: (appCount || 150) + 85
        })
      } catch (err) {
        console.warn('Landing data fetch warning:', err)
      }
    }
    loadLandingData()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      {/* Hero Section */}
      <section
        style={{
          textAlign: 'center',
          padding: '3.5rem 1rem 2rem',
          position: 'relative'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            letterSpacing: '0.02em'
          }}
        >
          <span>🏥</span> {t('brandTagline')}
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 900,
            maxWidth: '900px',
            margin: '0 auto 1.25rem',
            lineHeight: 1.15,
            letterSpacing: '-0.03em'
          }}
        >
          {t('landingHeroTitle')}
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '740px',
            margin: '0 auto 2.25rem',
            lineHeight: 1.6
          }}
        >
          {t('landingHeroSubtitle')}
        </p>

        {/* Hero CTAs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {user ? (
            <Link to="/dashboard" className="btn btn-lg btn-primary" style={{ padding: '0.9rem 2rem' }}>
              📊 {t('navDashboard')}
            </Link>
          ) : (
            <Link to="/auth" className="btn btn-lg btn-primary" style={{ padding: '0.9rem 2rem' }}>
              🚀 {t('landingCtaPrimary')}
            </Link>
          )}

          <Link to="/book" className="btn btn-lg btn-secondary" style={{ padding: '0.9rem 2rem' }}>
            📅 {t('landingCtaSecondary')}
          </Link>

          <Link to="/nearest" className="btn btn-lg btn-outline-primary" style={{ padding: '0.9rem 1.75rem' }}>
            📍 {t('landingViewAllHospitals')}
          </Link>
        </div>
      </section>

      {/* Metrics Banner */}
      <section
        className="glass-card"
        style={{
          padding: '2rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-light)', lineHeight: 1 }}>
            {stats.hospitals}+
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.5rem' }}>
            {t('landingStatsHospitals')}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
            {stats.doctors}+
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.5rem' }}>
            {t('landingStatsDoctors')}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>
            {stats.appointments}+
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.5rem' }}>
            {t('landingStatsAppointments')}
          </div>
        </div>
      </section>

      {/* 3 Pillars Overview Panel */}
      <OverviewPanel />

      {/* Partner Hospitals Showcase */}
      {hospitals.length > 0 && (
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                {t('landingHospitalsHeading')}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Accredited medical institutions equipped with top-tier departments
              </p>
            </div>
            <Link to="/nearest" className="btn btn-secondary">
              {t('landingViewAllHospitals')} →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {hospitals.map(h => (
              <div key={h.id} className="glass-card glass-card-interactive" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {h.photo_url && (
                  <div
                    style={{
                      height: '140px',
                      backgroundImage: `url(${h.photo_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: 'var(--bg-subtle)'
                    }}
                  />
                )}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>{h.name}</h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    {h.description || 'Comprehensive multi-specialty care and emergency services.'}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
                    📍 {h.address || 'Central Health District'}
                  </div>
                  <Link
                    to={`/book?hospital=${h.id}`}
                    className="btn btn-sm btn-primary"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    {t('navBook')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Specialist Network Showcase */}
      {doctors.length > 0 && (
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                {t('landingDoctorsHeading')}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Board-certified physicians and clinical consultants
              </p>
            </div>
            <Link to="/nearest" className="btn btn-secondary">
              {t('landingFindSpecialist')} →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {doctors.map(d => (
              <div key={d.id} className="glass-card glass-card-interactive" style={{ padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    backgroundImage: d.photo_url ? `url(${d.photo_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: 'var(--accent-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    flexShrink: 0,
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {!d.photo_url && '🩺'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem' }}>{d.name}</h4>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.25rem' }}>
                    {d.specialty || 'General Practitioner'}
                  </div>
                  {d.hospitals?.name && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      🏥 {d.hospitals.name}
                    </div>
                  )}
                  <Link
                    to={`/book?hospital=${d.hospital_id || ''}&doctor=${d.id}`}
                    className="btn btn-sm btn-outline-primary"
                    style={{ marginTop: '0.65rem' }}
                  >
                    {t('bookWithDoctor')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA Card */}
      <section
        className="glass-card"
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.75rem' }}>
          Experience Seamless Healthcare Administration
        </h2>
        <p style={{ fontSize: '1rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 1.75rem' }}>
          Join thousands of patients and providers managing consultations, records, and rapid check-in with Feras Medical.
        </p>
        <Link to="/auth" className="btn btn-lg" style={{ background: '#FFFFFF', color: 'var(--primary)', fontWeight: 800 }}>
          {t('landingCtaPrimary')}
        </Link>
      </section>
    </div>
  )
}
