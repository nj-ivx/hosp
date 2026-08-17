import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'

export default function DoctorsSection({ lockedHospitalId = null }) {
  const { t } = useLang()
  const { showToast } = useToast()
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [csvText, setCsvText] = useState('')
  const [csvImporting, setCsvImporting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    specialty: '',
    department: '',
    bio: '',
    photo_url: '',
    hospital_id: lockedHospitalId || ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch hospitals
      const { data: hospData } = await supabase
        .from('hospitals')
        .select('id, name')
        .order('name', { ascending: true })
      setHospitals(hospData || [])

      // Fetch doctors
      let query = supabase
        .from('doctors')
        .select('*, hospitals(name)')
        .order('name', { ascending: true })

      if (lockedHospitalId) {
        query = query.eq('hospital_id', lockedHospitalId)
      }

      const { data: docData, error } = await query
      if (error) throw error
      setDoctors(docData || [])
    } catch (err) {
      console.error('Error fetching doctors:', err)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [lockedHospitalId])

  const handleOpenModal = (doc = null) => {
    if (doc) {
      setEditingDoctor(doc)
      setForm({
        name: doc.name || '',
        specialty: doc.specialty || '',
        department: doc.department || '',
        bio: doc.bio || '',
        photo_url: doc.photo_url || '',
        hospital_id: doc.hospital_id || lockedHospitalId || ''
      })
    } else {
      setEditingDoctor(null)
      setForm({
        name: '',
        specialty: '',
        department: '',
        bio: '',
        photo_url: '',
        hospital_id: lockedHospitalId || (hospitals[0]?.id || '')
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showToast('Doctor name is required', 'warning')
      return
    }

    const payload = {
      name: form.name.trim(),
      specialty: form.specialty.trim() || null,
      department: form.department.trim() || null,
      bio: form.bio.trim() || null,
      photo_url: form.photo_url.trim() || null,
      hospital_id: lockedHospitalId || form.hospital_id || null
    }

    try {
      if (editingDoctor) {
        const { error } = await supabase
          .from('doctors')
          .update(payload)
          .eq('id', editingDoctor.id)
        if (error) throw error
        showToast('Doctor updated successfully', 'success')
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert(payload)
        if (error) throw error
        showToast('Doctor added successfully', 'success')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id)
      if (error) throw error
      showToast('Doctor deleted', 'success')
      fetchData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleCsvImport = async () => {
    if (!csvText.trim()) {
      showToast('Please provide CSV content', 'warning')
      return
    }

    try {
      setCsvImporting(true)
      const lines = csvText.trim().split('\n')
      if (lines.length < 2) {
        showToast('CSV must have a header line and at least one record', 'warning')
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
      const records = []

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        const cols = lines[i].split(',').map(c => c.trim().replace(/^['"]|['"]$/g, ''))
        const obj = {
          hospital_id: lockedHospitalId || (hospitals[0]?.id || null)
        }
        headers.forEach((h, idx) => {
          if (cols[idx] !== undefined) {
            obj[h] = cols[idx]
          }
        })
        if (obj.name) {
          records.push(obj)
        }
      }

      if (records.length === 0) {
        showToast('No valid doctor rows parsed from CSV', 'warning')
        return
      }

      const { error } = await supabase
        .from('doctors')
        .insert(records)

      if (error) throw error
      showToast(`Successfully imported ${records.length} doctors!`, 'success')
      setIsCsvModalOpen(false)
      setCsvText('')
      fetchData()
    } catch (err) {
      console.error('CSV import error:', err)
      showToast(err.message, 'error')
    } finally {
      setCsvImporting(false)
    }
  }

  const filtered = doctors.filter(d => {
    const q = search.toLowerCase()
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.specialty && d.specialty.toLowerCase().includes(q)) ||
      (d.department && d.department.toLowerCase().includes(q)) ||
      (d.hospitals?.name && d.hospitals.name.toLowerCase().includes(q))
    )
  })

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            {lockedHospitalId ? t('hospitalDoctorsHeading') : t('adminDoctorsSection')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage medical specialists, departments, and clinic assignments
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '220px', padding: '0.45rem 0.75rem' }}
            placeholder={t('search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="btn btn-secondary"
          >
            📥 {t('importCsvDoctors')}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary"
          >
            + {t('addDoctor')}
          </button>
        </div>
      </div>

      {/* Doctor Cards */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('noDoctorsFound')}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {filtered.map(d => (
            <div
              key={d.id}
              className="glass-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  backgroundImage: d.photo_url ? `url(${d.photo_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: 'var(--accent-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  flexShrink: 0,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {!d.photo_url && '🩺'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    marginBottom: '0.2rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {d.name}
                </h4>
                {d.specialty && (
                  <div
                    style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      marginBottom: '0.35rem'
                    }}
                  >
                    {d.specialty}
                  </div>
                )}
                {d.department && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    🏢 {d.department}
                  </div>
                )}
                {!lockedHospitalId && d.hospitals?.name && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    🏥 {d.hospitals.name}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    paddingTop: '0.65rem',
                    borderTop: '1px solid var(--border-subtle)'
                  }}
                >
                  <button
                    onClick={() => handleOpenModal(d)}
                    className="btn btn-sm btn-secondary"
                  >
                    ✏️ {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="btn btn-sm btn-danger"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              {editingDoctor ? t('editDoctor') : t('addDoctor')}
            </h3>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">{t('doctorName')} *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Dr. Sarah Johnson"
                />
              </div>

              {!lockedHospitalId && (
                <div className="form-group">
                  <label className="form-label">{t('selectHospital')} *</label>
                  <select
                    className="form-select"
                    value={form.hospital_id}
                    onChange={(e) => setForm({ ...form, hospital_id: e.target.value })}
                  >
                    <option value="">{t('chooseHospitalPlaceholder')}</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('doctorSpecialty')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    placeholder="e.g. Cardiology"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('doctorDepartment')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Internal Medicine"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('doctorPhotoUrl')}</label>
                <input
                  type="url"
                  className="form-input"
                  value={form.photo_url}
                  onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('doctorBio')}</label>
                <textarea
                  className="form-textarea"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCsvModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {t('importCsvDoctors')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {t('importCsvHelp')}
            </p>

            <div className="form-group">
              <textarea
                className="form-textarea"
                style={{ height: '160px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                placeholder={`name,specialty,department,bio,photo_url\nDr. Ahmed Ali,Cardiology,Heart Center,Senior Consultant,https://...\nDr. Reem Salem,Pediatrics,Children Health,Lead Pediatrician,https://...`}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="btn btn-secondary"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={csvImporting}
                onClick={handleCsvImport}
                className="btn btn-primary"
              >
                {csvImporting ? t('processing') : t('uploadCsvBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
