import { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabaseClient'
import PatientKeyCard from './PatientKeyCard'

export default function PatientView() {
  const { t } = useLang()
  const { session } = useAuth()
  const { showToast } = useToast()
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [visitNotes, setVisitNotes] = useState([])
  const [error, setError] = useState(null)
  const [cancelingId, setCancelingId] = useState(null)

  async function load() {
    try {
      const [{ data: p, error: pErr }, { data: a, error: aErr }, { data: v, error: vErr }] = await Promise.all([
        supabase.from('patients').select('*').eq('email', session.user.email).order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').eq('user_id', session.user.id).order('appointment_date', { ascending: true }),
        supabase.from('visit_notes').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      ])
      if (pErr) throw pErr
      if (aErr) throw aErr
      if (vErr) throw vErr
      setPatients(p || [])
      setAppointments(a || [])
      setVisitNotes(v || [])
    } catch (err) {
      setError("Couldn't load your records right now.")
    }
  }

  useEffect(() => { if (session) load() }, [session])

  const upcoming = appointments.find(
    (a) => a.status !== 'cancelled' && new Date(a.appointment_date) >= new Date(new Date().toDateString())
  )

  function notesForAppointment(apptId) {
    return visitNotes.filter((v) => v.appointment_id === apptId)
  }

  async function cancelAppointment(id) {
    if (!confirm('Cancel this appointment?')) return
    setCancelingId(id)
    try {
      const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
      if (error) throw error
      showToast('Appointment cancelled.')
      await load()
    } catch (err) {
      showToast("Couldn't cancel that appointment.", 'error')
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <PatientKeyCard />

      <div className="stat-grid cols-3">
        <div className="card stat-card"><div className="value">{patients.length}</div><div className="label">{t.stat_my_submissions}</div></div>
        <div className="card stat-card"><div className="value">{appointments.length}</div><div className="label">{t.stat_my_appointments}</div></div>
        <div className="card stat-card"><div className="value">{upcoming ? upcoming.appointment_date : '—'}</div><div className="label">{t.stat_next_appointment}</div></div>
      </div>

      <section className="panel">
        <div className="action-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <a className="card action-card" href="#/intake" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="icon">📝</span>
            <h3>{t.action_start_registration}</h3>
            <p>{t.action_start_registration_desc}</p>
          </a>
          <a className="card action-card" href="#/book" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="icon">📅</span>
            <h3>{t.action_book_appt}</h3>
            <p>{t.action_book_appt_desc}</p>
          </a>
          <a className="card action-card" href="#/nearest" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="icon">📍</span>
            <h3>Find Nearest Specialist</h3>
            <p>Search doctors by distance from you</p>
          </a>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>My Records</h2></div>
        <div className="card" style={{ padding: '8px 0', overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>{t.th_name}</th><th>{t.th_dob}</th><th>{t.th_registered}</th><th>Manage</th></tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>{p.first_name} {p.last_name}</td>
                  <td>{p.dob || '—'}</td>
                  <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  <td><a className="btn btn-ghost" href={`#/intake?id=${p.id}`} style={{ fontSize: 12, padding: '5px 10px' }}>Edit</a></td>
                </tr>
              ))}
            </tbody>
          </table>
          {patients.length === 0 && <div className="empty-state">No records submitted yet.</div>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>{t.my_appointments_title}</h2></div>
        <div className="card" style={{ padding: '8px 0', overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>{t.th_hospital}</th><th>{t.th_doctor}</th><th>{t.th_date}</th><th>{t.th_time}</th><th>{t.th_status}</th><th>What was done</th><th>Manage</th></tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const notes = notesForAppointment(a.id)
                return (
                  <tr key={a.id}>
                    <td>{a.hospital_name || '—'}</td>
                    <td>{a.doctor_name || '—'}</td>
                    <td>{a.appointment_date || '—'}</td>
                    <td>{a.appointment_time || '—'}</td>
                    <td><span className={`badge ${a.status === 'confirmed' ? 'badge-user' : 'badge-admin'}`}>{a.status || 'pending'}</span></td>
                    <td style={{ maxWidth: 220 }}>
                      {notes.length === 0
                        ? <span className="muted" style={{ fontSize: 12 }}>No notes yet</span>
                        : notes.map((n) => (
                          <div key={n.id} style={{ fontSize: 12, marginBottom: 4 }}>
                            {n.diagnosis && <div><strong>Diagnosis:</strong> {n.diagnosis}</div>}
                            {n.treatment && <div><strong>Treatment:</strong> {n.treatment}</div>}
                            {n.notes && <div className="muted">{n.notes}</div>}
                          </div>
                        ))}
                    </td>
                    <td>
                      {a.status !== 'cancelled' ? (
                        <button className="btn btn-danger" style={{ fontSize: 12, padding: '5px 10px' }}
                          disabled={cancelingId === a.id} onClick={() => cancelAppointment(a.id)}>
                          {cancelingId === a.id ? '…' : 'Cancel'}
                        </button>
                      ) : <span className="muted" style={{ fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {appointments.length === 0 && <div className="empty-state">{t.no_appointments}</div>}
        </div>
      </section>
    </>
  )
}
