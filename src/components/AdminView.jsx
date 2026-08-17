import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'
import HospitalsSection from './HospitalsSection'
import DoctorsSection from './DoctorsSection'

const PIE_COLORS = ['#0B5D66', '#1C9A80', '#2DD4BF', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B']

export default function AdminView() {
  const { t } = useLang()
  const { showToast } = useToast()

  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const [patientSearch, setPatientSearch] = useState('')
  const [appointmentSearch, setAppointmentSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchAdminData = async () => {
    try {
      setLoading(true)

      // 1. Fetch all patients
      const { data: patData, error: patErr } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
      if (patErr) throw patErr
      setPatients(patData || [])

      // 2. Fetch all appointments
      const { data: appData, error: appErr } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false })
      if (appErr) throw appErr
      setAppointments(appData || [])
    } catch (err) {
      console.error('Error fetching admin data:', err)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (error) throw error
      showToast(`Appointment status updated to ${newStatus}`, 'success')
      fetchAdminData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Export Patients CSV
  const handleExportPatientsCsv = () => {
    if (patients.length === 0) {
      showToast('No patients to export', 'warning')
      return
    }

    const headers = ['First Name', 'Last Name', 'DOB', 'Gender', 'Phone', 'Email', 'Blood Type', 'Weight', 'Allergies', 'Medications', 'Insurance', 'Policy Number']
    const rows = patients.map(p => [
      `"${p.first_name || ''}"`,
      `"${p.last_name || ''}"`,
      `"${p.dob || ''}"`,
      `"${p.gender || ''}"`,
      `"${p.phone || ''}"`,
      `"${p.email || ''}"`,
      `"${p.blood_type || ''}"`,
      `"${p.weight || ''}"`,
      `"${(p.allergies || '').replace(/"/g, '""')}"`,
      `"${(p.medications || '').replace(/"/g, '""')}"`,
      `"${p.insurance_provider || ''}"`,
      `"${p.policy_number || ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `patients_registry_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Appointments CSV
  const handleExportAppointmentsCsv = () => {
    if (appointments.length === 0) {
      showToast('No appointments to export', 'warning')
      return
    }

    const headers = ['Date', 'Time', 'Patient Name', 'Patient Email', 'Hospital', 'Doctor', 'Department', 'Reason', 'Status']
    const rows = appointments.map(a => [
      `"${a.appointment_date || ''}"`,
      `"${a.appointment_time || ''}"`,
      `"${a.patient_name || ''}"`,
      `"${a.patient_email || ''}"`,
      `"${a.hospital_name || ''}"`,
      `"${a.doctor_name || ''}"`,
      `"${a.department || ''}"`,
      `"${(a.reason || '').replace(/"/g, '""')}"`,
      `"${a.status || ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `appointments_ledger_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Stats Calculations
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const newThisWeek = patients.filter(p => p.created_at && p.created_at >= oneWeekAgo).length
  const withAllergies = patients.filter(p => p.allergies && p.allergies.trim().length > 0).length
  const withInsurance = patients.filter(p => p.insurance_provider && p.insurance_provider.trim().length > 0).length

  // Blood type distribution
  const bloodTypeCounts = {}
  patients.forEach(p => {
    const bt = p.blood_type || 'Unknown'
    bloodTypeCounts[bt] = (bloodTypeCounts[bt] || 0) + 1
  })
  const bloodTypeData = Object.entries(bloodTypeCounts).map(([name, value]) => ({ name, value }))

  // Appointments per day (next/last 7 days)
  const appDayCounts = {}
  appointments.slice(0, 40).forEach(a => {
    if (a.appointment_date) {
      appDayCounts[a.appointment_date] = (appDayCounts[a.appointment_date] || 0) + 1
    }
  })
  const appTimelineData = Object.entries(appDayCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-10)
    .map(([date, count]) => ({ date, count }))

  // Filtered Patients
  const filteredPatients = patients.filter(p => {
    const q = patientSearch.toLowerCase()
    const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
    return name.includes(q) || (p.phone && p.phone.includes(q)) || (p.blood_type && p.blood_type.toLowerCase().includes(q))
  })

  // Filtered Appointments
  const filteredAppointments = appointments.filter(a => {
    const q = appointmentSearch.toLowerCase()
    const matchQuery =
      (a.patient_name && a.patient_name.toLowerCase().includes(q)) ||
      (a.hospital_name && a.hospital_name.toLowerCase().includes(q)) ||
      (a.doctor_name && a.doctor_name.toLowerCase().includes(q)) ||
      (a.appointment_date && a.appointment_date.includes(q))
    
    if (statusFilter !== 'all') {
      return matchQuery && a.status === statusFilter
    }
    return matchQuery
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('roleAdmin')}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {t('adminPortalTitle')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Live control room, analytics, health records ledger, and facility operations
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/admin/users" className="btn btn-secondary">
              👥 {t('adminLinkUsers')}
            </Link>
            <Link to="/intake" className="btn btn-primary">
              + {t('adminLinkNewIntake')}
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}
      >
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('adminStatsTotalPatients')}
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '0.25rem' }}>
            {patients.length}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('adminStatsNewWeek')}
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.25rem' }}>
            +{newThisWeek}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('adminStatsAllergies')}
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--danger)', marginTop: '0.25rem' }}>
            {withAllergies}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('adminStatsInsurance')}
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.25rem' }}>
            {withInsurance}
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Appointments Volume */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem' }}>
            📈 {t('adminChartAppointmentsWeek')}
          </h4>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blood Types Pie */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem' }}>
            🩸 {t('adminChartBloodType')}
          </h4>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bloodTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {bloodTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Action CSV Exports */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
            ⚡ {t('adminQuickLinks')}
          </h4>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={handleExportPatientsCsv} className="btn btn-sm btn-secondary">
              📥 {t('adminExportPatientsCsv')}
            </button>
            <button onClick={handleExportAppointmentsCsv} className="btn btn-sm btn-secondary">
              📥 {t('adminExportAppointmentsCsv')}
            </button>
          </div>
        </div>
      </div>

      {/* Section: All Patients Registry */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {t('adminRecentPatients')}
          </h3>
          <input
            type="text"
            className="form-input"
            style={{ width: '240px', padding: '0.45rem 0.75rem' }}
            placeholder={t('search') + '...'}
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
          />
        </div>

        {filteredPatients.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No patients found.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('patientName')}</th>
                  <th>{t('dob')}</th>
                  <th>{t('gender')}</th>
                  <th>{t('bloodType')}</th>
                  <th>{t('phone')}</th>
                  <th>{t('allergies')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.slice(0, 15).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                    <td>{p.dob || '—'}</td>
                    <td>{p.gender || '—'}</td>
                    <td><span className="badge badge-info">{p.blood_type || '—'}</span></td>
                    <td>{p.phone || '—'}</td>
                    <td>
                      {p.allergies ? (
                        <span className="badge badge-danger">{p.allergies}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/intake?id=${p.id}`} className="btn btn-sm btn-secondary">
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

      {/* Section: Global Appointments */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {t('adminAllAppointments')}
          </h3>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: '140px', padding: '0.45rem 0.65rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('all')}</option>
              <option value="pending">{t('statusPending')}</option>
              <option value="confirmed">{t('statusConfirmed')}</option>
              <option value="cancelled">{t('statusCancelled')}</option>
            </select>

            <input
              type="text"
              className="form-input"
              style={{ width: '220px', padding: '0.45rem 0.75rem' }}
              placeholder={t('search') + '...'}
              value={appointmentSearch}
              onChange={(e) => setAppointmentSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No appointments found.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('date')}</th>
                  <th>{t('time')}</th>
                  <th>{t('patientName')}</th>
                  <th>{t('selectHospital')}</th>
                  <th>{t('selectDoctor')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.slice(0, 20).map(app => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{app.appointment_date}</td>
                    <td>{app.appointment_time || '—'}</td>
                    <td>{app.patient_name || 'Patient'}</td>
                    <td>{app.hospital_name || 'Hospital'}</td>
                    <td>{app.doctor_name || 'Specialist'}</td>
                    <td>
                      <span className={`badge ${app.status === 'confirmed' ? 'badge-success' : app.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', width: '120px' }}
                        value={app.status || 'pending'}
                        onChange={(e) => handleUpdateAppointmentStatus(app.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hospitals & Doctors CRUD Sections */}
      <HospitalsSection />
      <DoctorsSection />
    </div>
  )
}
