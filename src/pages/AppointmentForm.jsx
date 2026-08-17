import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM'
]

export default function AppointmentForm() {
  const { user } = useAuth()
  const { t } = useLang()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const queryHospital = searchParams.get('hospital') || ''
  const queryDoctor = searchParams.get('doctor') || ''

  const [hospitals, setHospitals] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Form State
  const [selectedHospitalId, setSelectedHospitalId] = useState(queryHospital)
  const [selectedDoctorId, setSelectedDoctorId] = useState(queryDoctor)
  const [patientName, setPatientName] = useState(user?.user_metadata?.full_name || '')
  const [patientEmail, setPatientEmail] = useState(user?.email || '')
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM')
  const [reason, setReason] = useState('')

  // Load hospitals & doctors
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true)

        // 1. Fetch hospitals
        const { data: hospData, error: hospErr } = await supabase
          .from('hospitals')
          .select('id, name, address')
          .order('name', { ascending: true })
        if (hospErr) throw hospErr
        setHospitals(hospData || [])

        // 2. Fetch all doctors
        const { data: docData, error: docErr } = await supabase
          .from('doctors')
          .select('id, name, specialty, department, hospital_id')
          .order('name', { ascending: true })
        if (docErr) throw docErr
        setDoctors(docData || [])

        // 3. Fetch patient profile if name is blank
        if (user?.id && !patientName) {
          const { data: patProfile } = await supabase
            .from('patients')
            .select('first_name, last_name, email')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

          if (patProfile) {
            setPatientName(`${patProfile.first_name || ''} ${patProfile.last_name || ''}`.trim())
            if (patProfile.email) setPatientEmail(patProfile.email)
          }
        }
      } catch (err) {
        console.error('Error loading booking data:', err)
        showToast(err.message, 'error')
      } finally {
        setLoadingInitial(false)
      }
    }

    loadData()
  }, [user?.id])

  // Filter doctors based on selected hospital
  const availableDoctors = doctors.filter(d => {
    if (!selectedHospitalId) return true
    return d.hospital_id === selectedHospitalId
  })

  // If a doctor was selected from query and hospital is determined, sync hospital
  useEffect(() => {
    if (queryDoctor && doctors.length > 0 && !selectedHospitalId) {
      const doc = doctors.find(d => d.id === queryDoctor)
      if (doc && doc.hospital_id) {
        setSelectedHospitalId(doc.hospital_id)
        setSelectedDoctorId(doc.id)
      }
    }
  }, [queryDoctor, doctors])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedHospitalId) {
      showToast('Please select a hospital facility', 'warning')
      return
    }

    const hospitalObj = hospitals.find(h => h.id === selectedHospitalId)
    const doctorObj = doctors.find(d => d.id === selectedDoctorId)

    try {
      setSubmitting(true)

      const payload = {
        user_id: user?.id || null,
        patient_name: patientName.trim() || 'Patient',
        patient_email: patientEmail.trim() || user?.email || null,
        hospital_id: selectedHospitalId,
        hospital_name: hospitalObj?.name || 'Hospital',
        doctor_id: selectedDoctorId || null,
        doctor_name: doctorObj ? `${doctorObj.name} (${doctorObj.specialty || ''})` : null,
        department: doctorObj?.department || null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: reason.trim() || 'Consultation',
        status: 'pending'
      }

      const { error } = await supabase
        .from('appointments')
        .insert(payload)

      if (error) throw error

      setBookingSuccess(true)
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        })
      } catch (e) {
        // ignore if canvas unavailable
      }
    } catch (err) {
      console.error('Booking submission error:', err)
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (bookingSuccess) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem 2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--success-soft)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1.5rem'
            }}
          >
            ✓
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            {t('bookingSuccessTitle')}
          </h2>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            {t('bookingSuccessMsg')}
          </p>

          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
              marginBottom: '2rem',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div><strong>{t('date')}:</strong> {appointmentDate} ({appointmentTime})</div>
            <div><strong>{t('selectHospital')}:</strong> {hospitals.find(h => h.id === selectedHospitalId)?.name}</div>
            {selectedDoctorId && (
              <div><strong>{t('selectDoctor')}:</strong> {doctors.find(d => d.id === selectedDoctorId)?.name}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              {t('navDashboard')}
            </Link>
            <button
              onClick={() => {
                setBookingSuccess(false)
                setReason('')
              }}
              className="btn btn-secondary"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
      <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {t('bookingTitle')}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {t('bookingSubtitle')}
          </p>
        </div>

        {loadingInitial ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('loading')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Patient Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('patientName')} *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('email')} *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Step 1: Cascading Hospital Picker */}
            <div className="form-group">
              <label className="form-label">{t('selectHospital')} *</label>
              <select
                className="form-select"
                required
                value={selectedHospitalId}
                onChange={(e) => {
                  setSelectedHospitalId(e.target.value)
                  setSelectedDoctorId('')
                }}
              >
                <option value="">{t('chooseHospitalPlaceholder')}</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} {h.address ? `(${h.address})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Doctor Picker (Filtered) */}
            <div className="form-group">
              <label className="form-label">{t('selectDoctor')}</label>
              <select
                className="form-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                disabled={!selectedHospitalId}
              >
                <option value="">{t('chooseDoctorPlaceholder')}</option>
                {availableDoctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty || d.department || 'Specialist'}
                  </option>
                ))}
              </select>
              {selectedHospitalId && availableDoctors.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {t('noDoctorsAtHospital')}
                </span>
              )}
            </div>

            {/* Step 3: Date & Slot */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('appointmentDate')} *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('appointmentTime')} *</label>
                <select
                  className="form-select"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 4: Reason */}
            <div className="form-group">
              <label className="form-label">{t('appointmentReason')}</label>
              <textarea
                className="form-textarea"
                placeholder={t('appointmentReasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {submitting ? t('processing') : t('bookSubmitBtn')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
