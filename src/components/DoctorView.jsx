import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'

export default function DoctorView() {
  const { doctorId } = useAuth()
  const { t } = useLang()
  const { showToast } = useToast()

  const [appointments, setAppointments] = useState([])
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'upcoming' | 'past'

  const fetchData = async () => {
    try {
      setLoading(true)

      // 1. Fetch doctor details
      if (doctorId) {
        const { data: docData } = await supabase
          .from('doctors')
          .select('*, hospitals(name)')
          .eq('id', doctorId)
          .maybeSingle()
        setDoctorInfo(docData)
      }

      // 2. Fetch appointments
      let query = supabase
        .from('appointments')
        .select('*, visit_notes(*)')
        .order('appointment_date', { ascending: true })

      if (doctorId) {
        query = query.eq('doctor_id', doctorId)
      }

      const { data: appData, error } = await query
      if (error) throw error
      setAppointments(appData || [])
    } catch (err) {
      console.error('Error fetching doctor data:', err)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [doctorId])

  const todayStr = new Date().toISOString().split('T')[0]

  // Stats
  const upcomingApps = appointments.filter(a => a.status !== 'cancelled' && a.appointment_date >= todayStr)
  const confirmedApps = appointments.filter(a => a.status === 'confirmed')
  const pastCancelledApps = appointments.filter(a => a.status === 'cancelled' || a.appointment_date < todayStr)

  // 14-day Chart Data
  const chartData = []
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dateKey = d.toISOString().split('T')[0]
    const count = appointments.filter(a => a.appointment_date === dateKey && a.status !== 'cancelled').length
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    chartData.push({ date: label, count, fullDate: dateKey })
  }

  // Filtered table rows
  const filteredAppointments = appointments.filter(a => {
    if (filterTab === 'upcoming') {
      return a.status !== 'cancelled' && a.appointment_date >= todayStr
    }
    if (filterTab === 'past') {
      return a.status === 'cancelled' || a.appointment_date < todayStr
    }
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('roleDoctor')}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {doctorInfo?.name || t('doctorPortalTitle')}
            </h2>
            {doctorInfo?.specialty && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                🩺 {doctorInfo.specialty} {doctorInfo.hospitals?.name ? `• ${doctorInfo.hospitals.name}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem'
        }}
      >
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('doctorStatsUpcoming')}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.25rem' }}>
            {upcomingApps.length}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('doctorStatsConfirmed')}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.25rem' }}>
            {confirmedApps.length}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('doctorStatsPast')}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {pastCancelledApps.length}
          </div>
        </div>
      </div>

      {/* 14-Day Appointment Volume Bar Chart */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          📊 {t('doctorChartTitle')}
        </h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Appointments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Schedule Table */}
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
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            {t('doctorScheduleHeading')}
          </h3>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilterTab('all')}
              className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('doctorScheduleAll')}
            </button>
            <button
              onClick={() => setFilterTab('upcoming')}
              className={`btn btn-sm ${filterTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('doctorScheduleUpcoming')}
            </button>
            <button
              onClick={() => setFilterTab('past')}
              className={`btn btn-sm ${filterTab === 'past' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('doctorSchedulePast')}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('loading')}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('doctorNoAppointments')}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('patientName')}</th>
                  <th>{t('date')}</th>
                  <th>{t('time')}</th>
                  <th>{t('appointmentReason')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map(app => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{app.patient_name || 'Patient'}</td>
                    <td>{app.appointment_date}</td>
                    <td>{app.appointment_time || '—'}</td>
                    <td>{app.reason || 'General Consultation'}</td>
                    <td>
                      <span className={`badge ${app.status === 'confirmed' ? 'badge-success' : app.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
