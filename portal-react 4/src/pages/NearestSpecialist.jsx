import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { distanceKm, getCurrentPosition } from '../lib/geo'
import Nav from '../components/Nav'
import VitalLine from '../components/VitalLine'

export default function NearestSpecialist() {
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [coords, setCoords] = useState(null)
  const [locError, setLocError] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [specialty, setSpecialty] = useState('')
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [{ data: d, error: dErr }, { data: h, error: hErr }] = await Promise.all([
          supabase.from('doctors').select('*'),
          supabase.from('hospitals').select('*'),
        ])
        if (dErr) throw dErr
        if (hErr) throw hErr
        setDoctors(d || [])
        setHospitals(h || [])
      } catch (err) {
        setLoadError("Couldn't load doctors right now.")
      }
    }
    load()
  }, [])

  async function requestLocation() {
    setLocError(null)
    setLocLoading(true)
    try {
      const pos = await getCurrentPosition()
      setCoords(pos)
    } catch (err) {
      setLocError('Could not get your location. Check your browser permissions and try again.')
    } finally {
      setLocLoading(false)
    }
  }

  const results = useMemo(() => {
    const q = specialty.trim().toLowerCase()
    let list = doctors.map((d) => {
      const hospital = hospitals.find((h) => h.id === d.hospital_id)
      const hasCoords = coords && hospital && hospital.latitude != null && hospital.longitude != null
      const distance = hasCoords ? distanceKm(coords.lat, coords.lng, hospital.latitude, hospital.longitude) : null
      return { ...d, hospital, distance }
    })
    if (q) {
      list = list.filter((d) =>
        (d.specialty || '').toLowerCase().includes(q) || (d.department || '').toLowerCase().includes(q)
      )
    }
    if (coords) {
      list.sort((a, b) => {
        if (a.distance == null) return 1
        if (b.distance == null) return -1
        return a.distance - b.distance
      })
    }
    return list
  }, [doctors, hospitals, coords, specialty])

  return (
    <div className="page">
      <Nav showRoleBadge />
      <VitalLine />
      <main className="container form-shell">
        <Link className="back-link" to="/dashboard">← Back to dashboard</Link>

        <div className="form-head">
          <h1>Find Nearest Specialist</h1>
          <p className="muted">Search by specialty and sort by distance from you.</p>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label>Specialty or department</label>
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Cardiology" />
            </div>
            <button type="button" className="btn btn-primary" onClick={requestLocation} disabled={locLoading} style={{ height: 42 }}>
              {locLoading ? 'Locating…' : (coords ? 'Update my location' : 'Use my location')}
            </button>
          </div>
          {locError && <div className="alert alert-error" style={{ marginTop: 12 }} role="alert">{locError}</div>}
          {loadError && <div className="alert alert-error" style={{ marginTop: 12 }} role="alert">{loadError}</div>}
          {!coords && !locError && (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
              Enable location to sort results by distance — otherwise results show in default order.
            </p>
          )}
        </div>

        <div className="doctor-grid">
          {results.map((d) => (
            <div className="card doctor-card" key={d.id}>
              <div className="avatar">{(d.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div>
              <h3>{d.name}</h3>
              <div className="dept">{d.department || d.specialty || ''}</div>
              {d.hospital && <p className="bio" style={{ fontWeight: 600, color: 'var(--ink)' }}>{d.hospital.name}</p>}
              {d.distance != null && (
                <p className="bio" style={{ color: 'var(--primary)', fontWeight: 600 }}>{d.distance.toFixed(1)} km away</p>
              )}
              <a className="btn btn-primary" href={`#/book?hospital=${d.hospital_id || ''}&doctor=${d.id}`} style={{ fontSize: 12, padding: '6px 12px' }}>
                Book with this doctor
              </a>
            </div>
          ))}
        </div>
        {results.length === 0 && <div className="empty-state">No doctors match that search.</div>}
      </main>
    </div>
  )
}
