import React, { useState, useEffect } from 'react'
import { supabase, getAllUserRoles, adminUpdateUserRole } from '../lib/supabaseClient'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'

const ROLES = [
  { value: 'user', label: 'Patient (user)' },
  { value: 'hospital', label: 'Hospital Staff (hospital)' },
  { value: 'doctor', label: 'Physician / Doctor (doctor)' },
  { value: 'admin', label: 'System Administrator (admin)' }
]

export default function AdminUsers() {
  const { t } = useLang()
  const { showToast } = useToast()

  const [userRoles, setUserRoles] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newRole, setNewRole] = useState('user')
  const [newHospitalId, setNewHospitalId] = useState('')
  const [newDoctorId, setNewDoctorId] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch user roles
      const rolesData = await getAllUserRoles()
      setUserRoles(rolesData || [])

      // Fetch hospitals
      const { data: hospData } = await supabase
        .from('hospitals')
        .select('id, name')
        .order('name', { ascending: true })
      setHospitals(hospData || [])

      // Fetch doctors
      const { data: docData } = await supabase
        .from('doctors')
        .select('id, name, specialty')
        .order('name', { ascending: true })
      setDoctors(docData || [])
    } catch (err) {
      console.error('Error fetching admin users:', err)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenEdit = (userItem) => {
    setSelectedUser(userItem)
    setNewRole(userItem.role || 'user')
    setNewHospitalId(userItem.hospital_id || '')
    setNewDoctorId(userItem.doctor_id || '')
    setIsModalOpen(true)
  }

  const handleSaveRole = async (e) => {
    e.preventDefault()
    if (!selectedUser?.user_id) return

    try {
      setUpdating(true)
      const res = await adminUpdateUserRole(
        selectedUser.user_id,
        newRole,
        newRole === 'hospital' ? newHospitalId : null,
        newRole === 'doctor' ? newDoctorId : null
      )

      if (!res.success) {
        throw new Error(res.error || 'Failed to update user role')
      }

      showToast(t('roleUpdatedSuccess'), 'success')
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      console.error('Save role error:', err)
      showToast(err.message, 'error')
    } finally {
      setUpdating(false)
    }
  }

  const filteredUsers = userRoles.filter(u => {
    const q = search.toLowerCase()
    return (
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.user_id && u.user_id.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.patient_key && u.patient_key.toLowerCase().includes(q))
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {t('userMgmtTitle')}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {t('userMgmtSubtitle')}
            </p>
          </div>

          <input
            type="text"
            className="form-input"
            style={{ width: '260px', padding: '0.5rem 0.85rem' }}
            placeholder={t('search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('loading')}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No users found.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('userId')}</th>
                  <th>{t('assignedRole')}</th>
                  <th>{t('patientKey')}</th>
                  <th>{t('assignedHospital')}</th>
                  <th>{t('assignedDoctor')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => {
                  const hosp = hospitals.find(h => h.id === u.hospital_id)
                  const doc = doctors.find(d => d.id === u.doctor_id)

                  const roleBadgeClass =
                    u.role === 'admin' ? 'badge-danger' :
                    u.role === 'hospital' ? 'badge-warning' :
                    u.role === 'doctor' ? 'badge-info' : 'badge-primary'

                  return (
                    <tr key={u.user_id || idx}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.email || u.user_id}</div>
                        {u.email && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {u.user_id}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${roleBadgeClass}`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-light)' }}>
                          {u.patient_key || '—'}
                        </span>
                      </td>
                      <td>{hosp ? hosp.name : '—'}</td>
                      <td>{doc ? `${doc.name} (${doc.specialty || ''})` : '—'}</td>
                      <td>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-sm btn-secondary"
                        >
                          ⚙️ {t('edit')}
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

      {/* Edit Role Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {t('changeRoleModalTitle')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', fontFamily: 'var(--font-mono)' }}>
              User ID: {selectedUser?.user_id}
            </p>

            <form onSubmit={handleSaveRole}>
              <div className="form-group">
                <label className="form-label">{t('selectNewRole')} *</label>
                <select
                  className="form-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {newRole === 'hospital' && (
                <div className="form-group">
                  <label className="form-label">{t('linkToHospital')}</label>
                  <select
                    className="form-select"
                    value={newHospitalId}
                    onChange={(e) => setNewHospitalId(e.target.value)}
                  >
                    <option value="">{t('noneOption')}</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {newRole === 'doctor' && (
                <div className="form-group">
                  <label className="form-label">{t('linkToDoctor')}</label>
                  <select
                    className="form-select"
                    value={newDoctorId}
                    onChange={(e) => setNewDoctorId(e.target.value)}
                  >
                    <option value="">{t('noneOption')}</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {d.specialty || ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn btn-primary"
                >
                  {updating ? t('processing') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
