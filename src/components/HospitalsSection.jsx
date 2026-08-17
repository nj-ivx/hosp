import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'
import { geocodeAddress } from '../lib/geocode'

export default function HospitalsSection() {
  const { t } = useLang()
  const { showToast } = useToast()
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHospital, setEditingHospital] = useState(null)
  const [geocoding, setGeocoding] = useState(false)

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    photo_url: '',
    latitude: '',
    longitude: ''
  })

  const fetchHospitals = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setHospitals(data || [])
    } catch (err) {
      console.error('Error fetching hospitals:', err)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHospitals()
  }, [])

  const handleOpenModal = (hospital = null) => {
    if (hospital) {
      setEditingHospital(hospital)
      setForm({
        name: hospital.name || '',
        address: hospital.address || '',
        phone: hospital.phone || '',
        description: hospital.description || '',
        photo_url: hospital.photo_url || '',
        latitude: hospital.latitude !== null ? hospital.latitude : '',
        longitude: hospital.longitude !== null ? hospital.longitude : ''
      })
    } else {
      setEditingHospital(null)
      setForm({
        name: '',
        address: '',
        phone: '',
        description: '',
        photo_url: '',
        latitude: '',
        longitude: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleAutoGeocode = async () => {
    if (!form.address.trim()) {
      showToast('Please enter an address first', 'warning')
      return
    }
    try {
      setGeocoding(true)
      const res = await geocodeAddress(form.address)
      setForm(prev => ({
        ...prev,
        latitude: res.latitude,
        longitude: res.longitude
      }))
      showToast(`Coords found: ${res.latitude}, ${res.longitude}`, 'success')
    } catch (err) {
      showToast('Could not geocode address', 'error')
    } finally {
      setGeocoding(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showToast('Hospital name is required', 'warning')
      return
    }

    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      description: form.description.trim() || null,
      photo_url: form.photo_url.trim() || null,
      latitude: form.latitude !== '' ? parseFloat(form.latitude) : null,
      longitude: form.longitude !== '' ? parseFloat(form.longitude) : null
    }

    try {
      if (editingHospital) {
        const { error } = await supabase
          .from('hospitals')
          .update(payload)
          .eq('id', editingHospital.id)
        if (error) throw error
        showToast('Hospital updated successfully', 'success')
      } else {
        const { error } = await supabase
          .from('hospitals')
          .insert(payload)
        if (error) throw error
        showToast('Hospital created successfully', 'success')
      }
      setIsModalOpen(false)
      fetchHospitals()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      const { error } = await supabase
        .from('hospitals')
        .delete()
        .eq('id', id)
      if (error) throw error
      showToast('Hospital deleted', 'success')
      fetchHospitals()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const filtered = hospitals.filter(h => {
    const q = search.toLowerCase()
    return (
      (h.name && h.name.toLowerCase().includes(q)) ||
      (h.address && h.address.toLowerCase().includes(q)) ||
      (h.phone && h.phone.includes(q))
    )
  })

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Header & Action */}
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
            {t('adminHospitalsSection')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage network medical facilities, locations, and coordinates
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
            onClick={() => handleOpenModal()}
            className="btn btn-primary"
          >
            + {t('addHospital')}
          </button>
        </div>
      </div>

      {/* Hospitals Grid */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('noHospitalsFound')}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {filtered.map(h => (
            <div
              key={h.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {h.photo_url && (
                <div
                  style={{
                    height: '140px',
                    width: '100%',
                    backgroundImage: `url(${h.photo_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: 'var(--bg-subtle)'
                  }}
                />
              )}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {h.name}
                </h4>
                {h.description && (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    {h.description}
                  </p>
                )}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  📍 {h.address || 'No address provided'}
                </div>
                {h.phone && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    📞 {h.phone}
                  </div>
                )}
                {h.latitude && h.longitude && (
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    🌐 {h.latitude}, {h.longitude}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)'
                  }}
                >
                  <button
                    onClick={() => handleOpenModal(h)}
                    className="btn btn-sm btn-secondary"
                  >
                    ✏️ {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="btn btn-sm btn-danger"
                  >
                    🗑️ {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              {editingHospital ? t('editHospital') : t('addHospital')}
            </h3>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">{t('hospitalName')} *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('hospitalAddress')}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="e.g. King Fahd Rd, Riyadh"
                  />
                  <button
                    type="button"
                    onClick={handleAutoGeocode}
                    disabled={geocoding}
                    className="btn btn-sm btn-secondary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {geocoding ? t('loading') : t('autoFillCoords')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('hospitalLatitude')}</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('hospitalLongitude')}</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('hospitalPhone')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+966 11 000 0000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('hospitalPhotoUrl')}</label>
                <input
                  type="url"
                  className="form-input"
                  value={form.photo_url}
                  onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('hospitalDesc')}</label>
                <textarea
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
    </div>
  )
}
