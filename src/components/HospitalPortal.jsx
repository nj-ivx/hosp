import React, { useState, useEffect } from 'react'
import { supabase, lookupPatientByKey } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'
import DoctorsSection from './DoctorsSection'

export default function HospitalPortal() {
  const { hospitalId } = useAuth()
  const { t } = useLang()
  const { showToast } = useToast()

  const [searchKey, setSearchKey] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupResult, setLookupResult] = useState(null)
  const [hospitalInfo, setHospitalInfo] = useState(null)

  // Visit Note Modal State
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [targetAppointment, setTargetAppointment] = useState(null)
  const [noteForm, setNoteForm] = useState({
    diagnosis: '',
    treatment: '',
    notes: ''
  })
  const [savingNote, setSavingNote] = useState(false)

  // Fetch hospital metadata if hospitalId is set
  useEffect(() => {
    async function getHosp() {
      if (!hospitalId) return
      const { data } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', hospitalId)
        .maybeSingle()
      setHospitalInfo(data)
    }
    getHosp()
  }, [hospitalId])

  const handleLookup = async (e) => {
    e?.preventDefault()
    if (!searchKey.trim()) return

    try {
      setLookingUp(true)
      const res = await lookupPatientByKey(searchKey.trim())
      if (!res || (!res.patient && res.appointments.length === 0)) {
        showToast(t('hospitalLookupNotFound'), 'warning')
        setLookupResult(null)
      } else {
        setLookupResult(res)
        showToast('Patient record retrieved successfully', 'success')
      }
    } catch (err) {
      console.error('Lookup error:', err)
      showToast(err.message, 'error')
    } finally {
      setLookingUp(false)
    }
  }

  const handleOpenAddNote = (appointment) => {
    setTargetAppointment(appointment)
    setNoteForm({
      diagnosis: '',
      treatment: '',
      notes: ''
    })
    setNoteModalOpen(true)
  }

  const handleSaveNote = async (e) => {
    e.preventDefault()
    if (!targetAppointment) return

    try {
      setSavingNote(true)
      const payload = {
        appointment_id: targetAppointment.id,
        user_id: lookupResult?.userId || targetAppointment.user_id,
        hospital_id: hospitalId || targetAppointment.hospital_id || null,
        doctor_id: targetAppointment.doctor_id || null,
        diagnosis: noteForm.diagnosis.trim(),
        treatment: noteForm.treatment.trim(),
        notes: noteForm.notes.trim() || null
      }

      const { error } = await supabase
        .from('visit_notes')
        .insert(payload)

      if (error) throw error

      showToast(t('noteAddedSuccess'), 'success')
      setNoteModalOpen(false)

      // Re-fetch patient lookup data
      if (searchKey) {
        const res = await lookupPatientByKey(searchKey.trim())
        setLookupResult(res)
      }
    } catch (err) {
      console.error('Save note error:', err)
      showToast(err.message, 'error')
    } finally {
      setSavingNote(false)
    }
  }

  const patient = lookupResult?.patient

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('roleHospital')}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {hospitalInfo?.name || t('hospitalPortalTitle')}
            </h2>
            {hospitalInfo?.address && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                📍 {hospitalInfo.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Patient Key Lookup Search */}
      <div
        className="glass-card"
        style={{
          padding: '1.75rem',
          border: '1.5px solid var(--border-focus)',
          background: 'linear-gradient(135deg, var(--bg-card-glass), var(--bg-card))'
        }}
      >
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          🔍 {t('hospitalLookupTitle')}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Scan patient barcode or type their 8-character ID key to instantly pull clinical history
        </p>

        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.75rem', maxWidth: '600px' }}>
          <input
            type="text"
            className="form-input"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.1rem',
              letterSpacing: '0.08em',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
            placeholder={t('hospitalLookupPlaceholder')}
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            disabled={lookingUp}
            className="btn btn-primary"
            style={{ padding: '0 1.5rem' }}
          >
            {lookingUp ? t('processing') : t('hospitalLookupBtn')}
          </button>
        </form>
      </div>

      {/* Patient Summary Result */}
      {lookupResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease-out' }}>
          {/* Summary Card with Red Allergy Banner */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {t('hospitalPatientSummary')}
                </h3>
                <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>
                  KEY: {lookupResult.patientKey}
                </span>
              </div>
              <span className="badge badge-primary">ACTIVE RECORD</span>
            </div>

            {/* Allergy Banner if allergies exist */}
            {patient?.allergies ? (
              <div
                style={{
                  background: 'var(--danger-soft)',
                  border: '1.5px solid var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>⚠️</span>
                <div>
                  <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.04em' }}>
                    {t('allergiesAlert')}
                  </div>
                  <div style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '1rem', marginTop: '0.15rem' }}>
                    {patient.allergies}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--success-soft)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  color: 'var(--success)',
                  fontWeight: 600
                }}
              >
                ✓ {t('noAllergies')}
              </div>
            )}

            {/* Patient Vitals Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('patientName')}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  {patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}` : '—'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('dob')} & {t('gender')}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                  {patient?.dob || '—'} ({patient?.gender || '—'})
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('bloodType')} & {t('weight')}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-light)', marginTop: '0.2rem' }}>
                  {patient?.blood_type || '—'} | {patient?.weight ? `${patient.weight} kg` : '—'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('phone')}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                  {patient?.phone || '—'}
                </div>
              </div>
            </div>

            {/* Clinical & Insurance Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem'
              }}
            >
              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('medications')}</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{patient?.medications || 'None recorded'}</div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('conditions')}</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{patient?.conditions || 'None recorded'}</div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('insuranceInfo')}</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {patient?.insurance_provider ? `${patient.insurance_provider} (#${patient.policy_number || 'N/A'})` : 'Self-Pay / Uninsured'}
                </div>
              </div>
            </div>
          </div>

          {/* Visit History & Add Notes Table */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              {t('hospitalVisitHistory')}
            </h3>

            {lookupResult.appointments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No previous appointments on record for this patient.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('date')}</th>
                      <th>{t('time')}</th>
                      <th>{t('selectDoctor')}</th>
                      <th>{t('appointmentReason')}</th>
                      <th>{t('status')}</th>
                      <th>{t('notes')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lookupResult.appointments.map(app => {
                      const notesList = app.visit_notes || []
                      return (
                        <tr key={app.id}>
                          <td style={{ fontWeight: 600 }}>{app.appointment_date}</td>
                          <td>{app.appointment_time || '—'}</td>
                          <td>{app.doctor_name || 'Specialist'}</td>
                          <td>{app.reason || 'Routine Consultation'}</td>
                          <td>
                            <span className={`badge ${app.status === 'confirmed' ? 'badge-success' : app.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                              {app.status}
                            </span>
                          </td>
                          <td>
                            {notesList.length > 0 ? (
                              <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                                ✓ {notesList.length} note(s)
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No notes</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleOpenAddNote(app)}
                              className="btn btn-sm btn-primary"
                            >
                              {t('hospitalAddNoteBtn')}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hospital's Doctors Section */}
      <DoctorsSection lockedHospitalId={hospitalId} />

      {/* Add Visit Note Modal */}
      {noteModalOpen && (
        <div className="modal-overlay" onClick={() => setNoteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {t('hospitalAddNoteTitle')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Appointment: {targetAppointment?.appointment_date} • {targetAppointment?.doctor_name || 'Specialist'}
            </p>

            <form onSubmit={handleSaveNote}>
              <div className="form-group">
                <label className="form-label">{t('diagnosis')} *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Acute Pharyngitis, Mild Bronchitis"
                  value={noteForm.diagnosis}
                  onChange={(e) => setNoteForm({ ...noteForm, diagnosis: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('treatment')} *</label>
                <textarea
                  required
                  className="form-textarea"
                  placeholder="e.g. Amoxicillin 500mg TID for 7 days, hydration, rest"
                  value={noteForm.treatment}
                  onChange={(e) => setNoteForm({ ...noteForm, treatment: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('clinicalNotes')}</label>
                <textarea
                  className="form-textarea"
                  placeholder="Follow-up in 10 days if symptoms persist..."
                  value={noteForm.notes}
                  onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(false)}
                  className="btn btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="btn btn-primary"
                >
                  {savingNote ? t('processing') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
