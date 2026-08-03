import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Nav from '../components/Nav'
import VitalLine from '../components/VitalLine'

export default function AppointmentForm() {
  const { t } = useLang()
  const { session } = useAuth()
  const [searchParams] = useSearchParams()

  const [hospitals, setHospitals] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loadError, setLoadError] = useState(null)

  const [patientName, setPatientName] = useState('')
  const [patientEmail, setPatientEmail] = useState(session?.user?.email || '')
  const [hospitalId, setHospitalId] = useState(searchParams.get('hospital') || '')
  const [doctorId, setDoctorId] = useState(searchParams.get('doctor') || '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')

  const [alert, setAlert] = useState(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (session?.user?.email) setPatientEmail(session.user.email)
  }, [session])

  useEffect(() => {
    async function load() {
      try {
        const [{ data: h, error: hErr }, { data: d, error: dErr }] = await Promise.all([
          supabase.from('hospitals').select('*').order('name'),
          supabase.from('doctors').select('*').order('name'),
        ])
        if (hErr) throw hErr
        if (dErr) throw dErr
        setHospitals(h || [])
        setDoctors(d || [])
      } catch (err) {
        setLoadError("Couldn't load hospitals and doctors right now. Please refresh the page.")
      }
    }
    load()
  }, [])

  const doctorsForHospital = useMemo(
    () => doctors.filter((d) => d.hospital_id === hospitalId),
    [doctors, hospitalId]
  )

  function resetForm() {
    setPatientName(''); setHospitalId(''); setDoctorId(''); setDate(''); setTime(''); setReason('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)

    const hospital = hospitals.find((h) => h.id === hospitalId)
    const doctor = doctors.find((d) => d.id === doctorId)
    if (!hospital || !doctor) {
      setAlert('Please choose both a hospital and a doctor.')
      return
    }

    setBusy(true)
    try {
      const record = {
        patient_name: patientName,
        patient_email: patientEmail,
        appointment_date: date,
        appointment_time: time,
        reason,
        user_id: session.user.id,
        status: 'pending',
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        department: doctor.department || doctor.specialty || '',
      }
      const { error } = await supabase.from('appointments').insert([record])
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      setAlert(err.message || "Couldn't book the appointment. Please check your entries and try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <Nav showRoleBadge />
      <VitalLine />
      <main className="container form-shell">
        <Link className="back-link" to="/dashboard">{t.back_dashboard}</Link>

        {!success && (
          <>
            <div className="form-head center">
              <h1>{t.appt_title}</h1>
              <p className="muted">{t.appt_sub}</p>
            </div>

            {(alert || loadError) && <div className="alert alert-error" role="alert">{alert || loadError}</div>}

            <form className="card card-form" onSubmit={handleSubmit}>
              <div className="field">
                <label>{t.label_full_name} *</label>
                <input required value={patientName} onChange={(e) => setPatientName(e.target.value)} />
              </div>
              <div className="field">
                <label>{t.label_email} *</label>
                <input type="email" required value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} />
              </div>
              <div className="field">
                <label>{t.label_hospital} *</label>
                <select required value={hospitalId} onChange={(e) => { setHospitalId(e.target.value); setDoctorId('') }}>
                  <option value="">{t.select_option}</option>
                  {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>{t.label_doctor} *</label>
                <select required disabled={!hospitalId} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                  <option value="">{!hospitalId ? t.select_hospital_first : t.select_option}</option>
                  {doctorsForHospital.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>{t.label_date} *</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="field">
                  <label>{t.label_time} *</label>
                  <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>{t.label_reason}</label>
                <textarea rows={3} placeholder="Briefly describe why you're booking" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 12 }}>
                <Link className="btn btn-ghost" to="/dashboard">{t.btn_cancel}</Link>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Booking…' : t.btn_book_appt}
                </button>
              </div>
            </form>
          </>
        )}

        {success && (
          <div className="success-screen card">
            <span className="icon">📅</span>
            <h2>{t.appt_success_title}</h2>
            <p className="muted">{t.appt_success_desc}</p>
            <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
              <Link className="btn btn-primary" to="/dashboard">{t.back_dashboard}</Link>
              <button className="btn btn-ghost" onClick={() => { resetForm(); setSuccess(false) }}>
                {t.btn_book_another}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
