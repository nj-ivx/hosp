import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabaseClient'
import DoctorsSection from './DoctorsSection'

export default function HospitalPortal() {
  const { hospitalId } = useAuth()
  const { showToast } = useToast()

  const [key, setKey] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [foundUserId, setFoundUserId] = useState(null)
  const [patientRecords, setPatientRecords] = useState([])
  const [appointments, setAppointments] = useState([])
  const [visitNotes, setVisitNotes] = useState([])

  const [noteApptId, setNoteApptId] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')
  const [notes, setNotes] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    setSearchError(null)
    setFoundUserId(null)
    setPatientRecords([])
    setAppointments([])
    setVisitNotes([])
    setSearching(true)
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('lookup_patient_by_key', { key: key.trim().toUpperCase() })
      if (rpcErr) throw rpcErr
      if (!rpcData || rpcData.length === 0) {
        setSearchError('No patient found with that key.')
        return
      }
      const userId = rpcData[0].user_id
      setFoundUserId(userId)

      const [{ data: patients, error: pErr }, { data: appts, error: aErr }, { data: notesData, error: nErr }] = await Promise.all([
        supabase.from('patients').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').eq('user_id', userId).order('appointment_date', { ascending: false }),
        supabase.from('visit_notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ])
      if (pErr) throw pErr
      if (aErr) throw aErr
      if (nErr) throw nErr
      setPatientRecords(patients || [])
      setAppointments(appts || [])
      setVisitNotes(notesData || [])
    } catch (err) {
      setSearchError("Couldn't look up that key right now.")
    } finally {
      setSearching(false)
    }
  }

  async function handleAddNote(e) {
    e.preventDefault()
    if (!noteApptId) {
      showToast('Choose which appointment this note is for.', 'error')
      return
    }
    setSavingNote(true)
    try {
      const appt = appointments.find((a) => a.id === noteApptId)
      const record = {
        appointment_id: noteApptId,
        user_id: foundUserId,
        hospital_id: hospitalId,
        doctor_id: appt?.doctor_id || null,
        diagnosis, treatment, notes,
      }
      const { error } = await supabase.from('visit_notes').insert([record])
      if (error) throw error
      showToast('Visit note saved.')
      setDiagnosis(''); setTreatment(''); setNotes(''); setNoteApptId('')
      const { data } = await supabase.from('visit_notes').select('*').eq('user_id', foundUserId).order('created_at', { ascending: false })
      setVisitNotes(data || [])
    } catch (err) {
      showToast("Couldn't save that note.", 'error')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <>
      <section className="panel">
        <div className="panel-head"><h2>Patient Lookup</h2></div>
        <form className="card" style={{ padding: 20, display: 'flex', gap: 10, alignItems: 'flex-end' }} onSubmit={handleSearch}>
          <div className="field" style={{ marginBottom: 0, flex: 1 }}>
            <label>Patient Key</label>
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. A1B2C3D4" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={searching}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>

        {searchError && <div className="alert alert-error" style={{ marginTop: 12 }} role="alert">{searchError}</div>}

        {foundUserId && (
          <div style={{ marginTop: 20 }}>
            <div className="card" style={{ padding: 20, overflowX: 'auto' }}>
              <h3 style={{ fontSize: 14, marginBottom: 10 }}>Patient Records</h3>
              <table>
                <thead>
                  <tr><th>Name</th><th>DOB</th><th>Blood Type</th><th>Allergies</th><th>Conditions</th><th>Medications</th></tr>
                </thead>
                <tbody>
                  {patientRecords.map((p) => (
                    <tr key={p.id}>
                      <td>{p.first_name} {p.last_name}</td>
                      <td>{p.dob || '—'}</td>
                      <td>{p.blood_type || '—'}</td>
                      <td style={{ color: p.allergies ? 'var(--danger)' : 'var(--ink-muted)', fontWeight: p.allergies ? 600 : 400 }}>
                        {p.allergies || 'None on file'}
                      </td>
                      <td>{p.conditions || '—'}</td>
                      <td>{p.medications || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {patientRecords.length === 0 && <div className="empty-state">No intake record on file for this patient.</div>}
            </div>

            <div className="card" style={{ padding: 20, marginTop: 16, overflowX: 'auto' }}>
              <h3 style={{ fontSize: 14, marginBottom: 10 }}>Appointment & Visit History</h3>
              <table>
                <thead>
                  <tr><th>Date</th><th>Hospital</th><th>Doctor</th><th>Status</th><th>Notes on file</th></tr>
                </thead>
                <tbody>
                  {appointments.map((a) => {
                    const apptNotes = visitNotes.filter((n) => n.appointment_id === a.id)
                    return (
                      <tr key={a.id}>
                        <td>{a.appointment_date} {a.appointment_time}</td>
                        <td>{a.hospital_name || '—'}</td>
                        <td>{a.doctor_name || '—'}</td>
                        <td><span className={`badge ${a.status === 'confirmed' ? 'badge-user' : 'badge-admin'}`}>{a.status}</span></td>
                        <td style={{ maxWidth: 220 }}>
                          {apptNotes.length === 0 ? <span className="muted" style={{ fontSize: 12 }}>None</span> :
                            apptNotes.map((n) => (
                              <div key={n.id} style={{ fontSize: 12, marginBottom: 4 }}>
                                {n.diagnosis && <div><strong>Dx:</strong> {n.diagnosis}</div>}
                                {n.treatment && <div><strong>Tx:</strong> {n.treatment}</div>}
                              </div>
                            ))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {appointments.length === 0 && <div className="empty-state">No appointment history for this patient.</div>}
            </div>

            <form className="card" style={{ padding: 20, marginTop: 16 }} onSubmit={handleAddNote}>
              <h3 style={{ fontSize: 14, marginBottom: 10 }}>Add a Visit Note</h3>
              <div className="field">
                <label>Which appointment?</label>
                <select value={noteApptId} onChange={(e) => setNoteApptId(e.target.value)} required>
                  <option value="">Select…</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>{a.appointment_date} — {a.doctor_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Diagnosis</label>
                  <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                </div>
                <div className="field">
                  <label>Treatment</label>
                  <input value={treatment} onChange={(e) => setTreatment(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={savingNote}>
                  {savingNote ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <DoctorsSection isAdmin hospitals={[]} lockedHospitalId={hospitalId} />
    </>
  )
}
