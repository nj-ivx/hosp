import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabaseClient'

function exportCsv(rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(',')]
    .concat(rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'patients_export.csv'
  link.click()
}

function weekKey(dateStr) {
  const d = new Date(dateStr)
  const onejan = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

const PIE_COLORS = ['#0B5D66', '#2FBFA0', '#3FC6BE', '#7FE0D6', '#B8791E', '#C1443C', '#5B7377', '#1C9A80']

export default function AdminView() {
  const { t } = useLang()
  const { showToast } = useToast()
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState(null)
  const [savingId, setSavingId] = useState(null)

  const [patientSearch, setPatientSearch] = useState('')
  const [apptStatusFilter, setApptStatusFilter] = useState('all')

  async function loadPatients() {
    try {
      const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setPatients(data || [])
    } catch (err) {
      setError("Couldn't load patient statistics. The table may be empty or unavailable.")
    }
  }

  async function loadAppointments() {
    try {
      const { data, error } = await supabase.from('appointments').select('*').order('appointment_date', { ascending: true })
      if (error) throw error
      setAppointments(data || [])
    } catch (err) {
      setError("Couldn't load appointments right now.")
    }
  }

  useEffect(() => { loadPatients(); loadAppointments() }, [])

  const total = patients.length
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const newThisWeek = patients.filter((p) => new Date(p.created_at).getTime() >= oneWeekAgo).length
  const withAllergies = patients.filter((p) => p.allergies && p.allergies.trim() !== '').length
  const withInsurance = patients.filter((p) => p.insurance_provider && p.insurance_provider.trim() !== '').length

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    )
  }, [patients, patientSearch])

  const filteredAppointments = useMemo(() => {
    if (apptStatusFilter === 'all') return appointments
    return appointments.filter((a) => (a.status || 'pending') === apptStatusFilter)
  }, [appointments, apptStatusFilter])

  const apptByWeek = useMemo(() => {
    const counts = {}
    appointments.forEach((a) => {
      if (!a.appointment_date) return
      const key = weekKey(a.appointment_date)
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts).sort().slice(-8).map(([week, count]) => ({ week, count }))
  }, [appointments])

  const bloodTypeData = useMemo(() => {
    const counts = {}
    patients.forEach((p) => {
      const bt = p.blood_type || 'Unknown'
      counts[bt] = (counts[bt] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [patients])

  async function updateStatus(id, status) {
    setSavingId(id)
    try {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
      if (error) throw error
      showToast('Appointment updated.')
      await loadAppointments()
    } catch (err) {
      showToast("Couldn't update that appointment.", 'error')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="stat-grid">
        <div className="card stat-card"><div className="value">{total}</div><div className="label">{t.stat_total}</div></div>
        <div className="card stat-card"><div className="value">{newThisWeek}</div><div className="label">{t.stat_week}</div></div>
        <div className="card stat-card"><div className="value">{withAllergies}</div><div className="label">{t.stat_allergy}</div></div>
        <div className="card stat-card"><div className="value">{withInsurance}</div><div className="label">{t.stat_insured}</div></div>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>Analytics</h2></div>
        <div className="grid-2">
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Appointments per week</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={apptByWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#0B5D66" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Patients by blood type</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={bloodTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {bloodTypeData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>{t.panel_db_access}</h2></div>
        <div className="action-grid">
          <a className="card action-card" href="#/intake" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="icon">📝</span>
            <h3>{t.action_new_intake}</h3>
            <p>{t.action_new_intake_desc}</p>
          </a>
          <a className="card action-card" href="https://supabase.com/dashboard/project/YOUR-PROJECT-REF/editor" target="_blank" rel="noopener" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="icon">🗄️</span>
            <h3>{t.action_supabase}</h3>
            <p>{t.action_supabase_desc}</p>
          </a>
          <div className="card action-card" onClick={() => exportCsv(patients)}>
            <span className="icon">⬇️</span>
            <h3>{t.action_export}</h3>
            <p>{t.action_export_desc}</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>{t.panel_recent_patients}</h2></div>
        <div className="filter-bar">
          <input placeholder="Search by name or email…" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
        </div>
        <div className="card" style={{ padding: '8px 0', overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>{t.th_name}</th><th>{t.th_dob}</th><th>{t.th_blood}</th><th>{t.th_insurance}</th><th>{t.th_registered}</th><th>Manage</th></tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p.id}>
                  <td>{p.first_name} {p.last_name}</td>
                  <td>{p.dob || '—'}</td>
                  <td>{p.blood_type || '—'}</td>
                  <td>{p.insurance_provider || '—'}</td>
                  <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  <td><a className="btn btn-ghost" href={`#/intake?id=${p.id}`} style={{ fontSize: 12, padding: '5px 10px' }}>Edit</a></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPatients.length === 0 && <div className="empty-state">No matching patient records.</div>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>{t.panel_appointments}</h2></div>
        <div className="filter-bar">
          <select value={apptStatusFilter} onChange={(e) => setApptStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="card" style={{ padding: '8px 0', overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>{t.th_patient}</th><th>{t.th_hospital}</th><th>{t.th_doctor}</th>
                <th>{t.th_date}</th><th>{t.th_time}</th><th>{t.th_status}</th><th>{t.th_manage}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((a) => (
                <AppointmentRow key={a.id} appt={a} busy={savingId === a.id} onSave={updateStatus} />
              ))}
            </tbody>
          </table>
          {filteredAppointments.length === 0 && <div className="empty-state">No matching appointments.</div>}
        </div>
      </section>
    </>
  )
}

function AppointmentRow({ appt, busy, onSave }) {
  const [status, setStatus] = useState(appt.status || 'pending')
  return (
    <tr>
      <td>{appt.patient_name}<br /><span className="muted" style={{ fontSize: 12 }}>{appt.patient_email}</span></td>
      <td>{appt.hospital_name || '—'}</td>
      <td>{appt.doctor_name || '—'}</td>
      <td>{appt.appointment_date || '—'}</td>
      <td>{appt.appointment_time || '—'}</td>
      <td><span className={`badge ${status === 'confirmed' ? 'badge-user' : 'badge-admin'}`}>{status}</span></td>
      <td>
        <div className="appt-actions">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-primary" disabled={busy} onClick={() => onSave(appt.id, status)}>
            {busy ? '…' : 'Save'}
          </button>
        </div>
      </td>
    </tr>
  )
}
