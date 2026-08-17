import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'
import PatientKeyCard from './PatientKeyCard'

export default function PatientView() {
  const { user, patientKey } = useAuth()
  const { t } = useLang()
  const { showToast } = useToast()

  const [records, setRecords] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNotes, setSelectedNotes] = useState(null)

  const fetchPatientData = async () => {
    if (!user?.id) return
    try {
      setLoading(true)

      // Fetch patient records
      const { data: recData } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch appointments with visit notes
      const { data: appData } = await supabase
        .from('appointments')
        .select(`
          *,
          visit_notes (*)
        `)
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: false })

      setRecords(recData || [])
      setAppointments(appData || [])
    } catch (err) {
      console.error('Error fetching patient dashboard data:', err)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatientData()
  }, [user?.id])

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm(t('cancelAppointmentConfirm'))) return

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)

      if (error) throw error
      showToast(t('appointmentCancelledSuccess'), 'success')
      fetchPatientData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Next upcoming appointment
  const nowStr = new Date().toISOString().split('T')[0]
  const upcoming = appointments
    .filter(a => a.status !== 'cancelled' && a.appointment_date >= nowStr)
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
  const nextApp = upcoming[0]

  const latestRecord = records[0]
  const patientFullName = latestRecord
    ? `${latestRecord.first_name || ''} ${latestRecord.last_name || ''}`.trim()
    : (user?.user_metadata?.full_name || '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner: Key Card & Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        {/* Barcode & Keycard */}
        <PatientKeyCard
          patientKey={patientKey}
          patientName={patientFullName}
          email={user?.email}
        />

        {/* Stats & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '1rem'
            }}
          >
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('patientStatsRecords')}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '0.25rem' }}>
                {records.length}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('patientStatsAppointments')}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.25rem' }}>
                {appointments.length}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('patientStatsNextDate')}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.45rem' }}>
                {nextApp ? `${nextApp.appointment_date} (${nextApp.appointment_time || ''})` : t('patientNoUpcoming')}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              {t('patientQuickActions')}
            </h4>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/intake" className="btn btn-primary" style={{ flex: 1, minWidth: '160px' }}>
                📝 {t('patientActionIntake')}
              </Link>
              <Link to="/book" className="btn btn-secondary" style={{ flex: 1, minWidth: '160px' }}>
                📅 {t('patientActionBook')}
              </Link>
              <Link to="/nearest" className="btn btn-outline-primary" style={{ flex: 1, minWidth: '160px' }}>
                📍 {t('patientActionNearest')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: My Medical Records */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {t('patientRecordsHeading')}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Primary clinical intake and health profile history
            </p>
          </div>
          <Link to="/intake" className="btn btn-sm btn-primary">
            + {t('patientActionIntake')}
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('loading')}
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: '1rem' }}>{t('patientNoRecords')}</p>
            <Link to="/intake" className="btn btn-primary">
              {t('patientActionIntake')}
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('patientName')}</th>
                  <th>{t('dob')}</th>
                  <th>{t('bloodType')}</th>
                  <th>{t('allergies')}</th>
                  <th>{t('insuranceProvider')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 600 }}>
                      {rec.first_name} {rec.last_name}
                    </td>
                    <td>{rec.dob || '—'}</td>
                    <td>
                      <span className="badge badge-info">{rec.blood_type || '—'}</span>
                    </td>
                    <td>
                      {rec.allergies ? (
                        <span className="badge badge-danger">{rec.allergies}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>{t('noAllergies')}</span>
                      )}
                    </td>
                    <td>{rec.insurance_provider || 'Self-pay'}</td>
                    <td>
                      <Link to={`/intake?id=${rec.id}`} className="btn btn-sm btn-secondary">
                        ✏️ {t('edit')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: My Scheduled Appointments */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {t('patientAppointmentsHeading')}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Consultations, clinical check-ups, and visit notes
            </p>
          </div>
          <Link to="/book" className="btn btn-sm btn-primary">
            + {t('patientActionBook')}
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('loading')}
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: '1rem' }}>{t('patientNoAppointments')}</p>
            <Link to="/book" className="btn btn-primary">
              {t('patientActionBook')}
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('date')}</th>
                  <th>{t('time')}</th>
                  <th>{t('selectHospital')}</th>
                  <th>{t('selectDoctor')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(app => {
                  const statusBadgeClass =
                    app.status === 'confirmed' ? 'badge-success' :
                    app.status === 'cancelled' ? 'badge-danger' : 'badge-warning'

                  const notes = app.visit_notes || []

                  return (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>{app.appointment_date}</td>
                      <td>{app.appointment_time || '—'}</td>
                      <td>{app.hospital_name || 'Hospital'}</td>
                      <td>{app.doctor_name || 'Specialist'}</td>
                      <td>
                        <span className={`badge ${statusBadgeClass}`}>
                          {app.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {notes.length > 0 && (
                            <button
                              onClick={() => setSelectedNotes(notes[0])}
                              className="btn btn-sm btn-outline-primary"
                            >
                              📋 {t('viewNotes')}
                            </button>
                          )}
                          {app.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelAppointment(app.id)}
                              className="btn btn-sm btn-danger"
                            >
                              ✕ {t('cancel')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visit Notes Modal */}
      {selectedNotes && (
        <div className="modal-overlay" onClick={() => setSelectedNotes(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
              📋 {t('hospitalAddNoteTitle')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {t('diagnosis')}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem' }}>
                  {selectedNotes.diagnosis || '—'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {t('treatment')}
                </div>
                <div style={{ fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  {selectedNotes.treatment || '—'}
                </div>
              </div>

              {selectedNotes.notes && (
                <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {t('clinicalNotes')}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {selectedNotes.notes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setSelectedNotes(null)} className="btn btn-secondary">
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
