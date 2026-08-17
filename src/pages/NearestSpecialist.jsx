import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { calculateDistance, getUserLocation } from '../lib/geo'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'

export default function NearestSpecialist() {
  const { t } = useLang()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState('hospitals') // 'hospitals' | 'specialists'
  const [userCoords, setUserCoords] = useState(null)
  const [geoStatus, setGeoStatus] = useState('prompting') // 'prompting' | 'acquired' | 'failed'

  const [hospitals, setHospitals] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  const [hospSearch, setHospSearch] = useState('')
  const [docSearch, setDocSearch] = useState('')

  // 1. Get GPS Location
  useEffect(() => {
    async function detectLocation() {
      try {
        setGeoStatus('prompting')
        const res = await getUserLocation()
        setUserCoords(res.coords)
        setGeoStatus(res.isDefault ? 'failed' : 'acquired')
      } catch (err) {
        setGeoStatus('failed')
      }
    }
    detectLocation()
  }, [])

  // 2. Fetch Hospitals & Doctors
  useEffect(() => {
    async function loadDirectory() {
      try {
        setLoading(true)

        // Hospitals
        const { data: hospData, error: hospErr } = await supabase
          .from('hospitals')
          .select('*')
        if (hospErr) throw hospErr

        // Doctors
        const { data: docData, error: docErr } = await supabase
          .from('doctors')
          .select('*, hospitals(*)')
        if (docErr) throw docErr

        setHospitals(hospData || [])
        setDoctors(docData || [])
      } catch (err) {
        console.error('Error loading directory:', err)
        showToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }

    loadDirectory()
  }, [])

  // Calculate distance & sort hospitals
  const processedHospitals = hospitals.map(h => {
    let dist = null
    if (userCoords && h.latitude && h.longitude) {
      dist = calculateDistance(userCoords.latitude, userCoords.longitude, h.latitude, h.longitude)
    }
    return { ...h, distance: dist }
  }).sort((a, b) => {
    if (a.distance === null) return 1
    if (b.distance === null) return -1
    return a.distance - b.distance
  })

  // Filter hospitals
  const filteredHospitals = processedHospitals.filter(h => {
    const q = hospSearch.toLowerCase()
    return (
      (h.name && h.name.toLowerCase().includes(q)) ||
      (h.address && h.address.toLowerCase().includes(q))
    )
  })

  // Calculate distance & sort doctors based on their hospital
  const processedDoctors = doctors.map(d => {
    let dist = null
    const hosp = d.hospitals
    if (userCoords && hosp?.latitude && hosp?.longitude) {
      dist = calculateDistance(userCoords.latitude, userCoords.longitude, hosp.latitude, hosp.longitude)
    }
    return { ...d, distance: dist }
  }).sort((a, b) => {
    if (a.distance === null) return 1
    if (b.distance === null) return -1
    return a.distance - b.distance
  })

  // Filter doctors
  const filteredDoctors = processedDoctors.filter(d => {
    const q = docSearch.toLowerCase()
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.specialty && d.specialty.toLowerCase().includes(q)) ||
      (d.department && d.department.toLowerCase().includes(q)) ||
      (d.hospitals?.name && d.hospitals.name.toLowerCase().includes(q))
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {t('nearestPageTitle')}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {t('nearestPageSubtitle')}
            </p>
          </div>

          {/* GPS Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: geoStatus === 'acquired' ? 'var(--success-soft)' : 'var(--bg-subtle)',
              border: `1px solid ${geoStatus === 'acquired' ? 'var(--success)' : 'var(--border-subtle)'}`,
              fontSize: '0.8rem',
              fontWeight: 600,
              color: geoStatus === 'acquired' ? 'var(--success)' : 'var(--text-muted)'
            }}
          >
            <span>{geoStatus === 'acquired' ? '📍' : '📡'}</span>
            <span>
              {geoStatus === 'acquired' ? t('geoDetected') :
               geoStatus === 'prompting' ? t('geoPrompting') : t('geoFailed')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          maxWidth: '440px'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('hospitals')}
          style={{
            flex: 1,
            padding: '0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'hospitals' ? 700 : 500,
            fontSize: '0.9rem',
            background: activeTab === 'hospitals' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'hospitals' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'hospitals' ? 'var(--shadow-sm)' : 'none',
            transition: 'var(--transition)'
          }}
        >
          🏥 {t('tabHospitals')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('specialists')}
          style={{
            flex: 1,
            padding: '0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'specialists' ? 700 : 500,
            fontSize: '0.9rem',
            background: activeTab === 'specialists' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'specialists' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'specialists' ? 'var(--shadow-sm)' : 'none',
            transition: 'var(--transition)'
          }}
        >
          🩺 {t('tabSpecialists')}
        </button>
      </div>

      {/* Tab 1: Hospitals */}
      {activeTab === 'hospitals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Search Box */}
          <div style={{ maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder={t('searchHospitalsPlaceholder')}
              value={hospSearch}
              onChange={(e) => setHospSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('loading')}
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('noHospitalsFound')}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}
            >
              {filteredHospitals.map(h => (
                <div
                  key={h.id}
                  className="glass-card glass-card-interactive"
                  style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                >
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

                  <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{h.name}</h3>
                      {h.distance !== null && (
                        <span className="badge badge-primary" style={{ flexShrink: 0 }}>
                          📍 {h.distance} {t('distanceKm')}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {h.description || 'Comprehensive clinical center with multi-specialty clinics.'}
                    </p>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      📍 {h.address || 'Address provided on arrival'}
                    </div>

                    {h.phone && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        📞 {h.phone}
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '1.25rem' }}>
                      <Link
                        to={`/book?hospital=${h.id}`}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                      >
                        📅 {t('navBook')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Specialists */}
      {activeTab === 'specialists' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Search Box */}
          <div style={{ maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder={t('searchDoctorsPlaceholder')}
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('loading')}
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('noDoctorsFound')}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}
            >
              {filteredDoctors.map(d => (
                <div
                  key={d.id}
                  className="glass-card glass-card-interactive"
                  style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '12px',
                        backgroundImage: d.photo_url ? `url(${d.photo_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: 'var(--accent-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        flexShrink: 0,
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      {!d.photo_url && '🩺'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{d.name}</h4>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', marginTop: '0.15rem' }}>
                        {d.specialty || 'General Practitioner'}
                      </div>
                      {d.department && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          🏢 {d.department}
                        </div>
                      )}
                    </div>
                  </div>

                  {d.bio && (
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                      {d.bio}
                    </p>
                  )}

                  {/* Hospital & Distance Badge */}
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      marginTop: 'auto',
                      marginBottom: '1rem'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      🏥 {d.hospitals?.name || 'Medical Center'}
                    </span>
                    {d.distance !== null && (
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        {d.distance} {t('distanceKm')}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/book?hospital=${d.hospital_id || ''}&doctor=${d.id}`}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    📅 {t('bookWithDoctor')}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
