import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabaseClient'

function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function HospitalsSection({ isAdmin, onChange }) {
  const { t } = useLang()
  const { showToast } = useToast()
  const [hospitals, setHospitals] = useState([])
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    try {
      const { data, error } = await supabase.from('hospitals').select('*').order('created_at', { ascending: true })
      if (error) throw error
      setHospitals(data || [])
      if (onChange) onChange(data || [])
    } catch (err) {
      setError('Couldn\'t load hospitals right now.')
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return hospitals
    return hospitals.filter((h) => (h.name || '').toLowerCase().includes(q) || (h.address || '').toLowerCase().includes(q))
  }, [hospitals, search])

  function openForm(h) {
    setEditId(h ? h.id : '')
    setName(h ? h.name || '' : '')
    setPhone(h ? h.phone || '' : '')
    setAddress(h ? h.address || '' : '')
    setDescription(h ? h.description || '' : '')
    setPhotoUrl(h ? h.photo_url || '' : '')
    setLatitude(h ? h.latitude ?? '' : '')
    setLongitude(h ? h.longitude ?? '' : '')
    setFormOpen(true)
  }
  function closeForm() { setFormOpen(false) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const record = {
      name, phone, address, description, photo_url: photoUrl,
      latitude: latitude === '' ? null : Number(latitude),
      longitude: longitude === '' ? null : Number(longitude),
    }
    try {
      const { error } = editId
        ? await supabase.from('hospitals').update(record).eq('id', editId)
        : await supabase.from('hospitals').insert([record])
      if (error) throw error
      showToast(editId ? 'Hospital updated.' : 'Hospital added.')
      closeForm()
      await load()
    } catch (err) {
      showToast('Couldn\'t save that hospital.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this hospital?')) return
    try {
      const { error } = await supabase.from('hospitals').delete().eq('id', id)
      if (error) throw error
      showToast('Hospital removed.')
      await load()
    } catch (err) {
      showToast('Couldn\'t remove that hospital right now.', 'error')
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{t.hospitals_title}</h2>
        {isAdmin && (
          <button className="btn btn-ghost" onClick={() => (formOpen ? closeForm() : openForm(null))}>
            {t.add_hospital}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="filter-bar">
        <input placeholder="Search by name or address…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {formOpen && (
        <form className="card" onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="field">
              <label>{t.hospital_name}</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>{t.hospital_phone}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>{t.hospital_address}</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="field">
            <label>Photo URL</label>
            <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Latitude</label>
              <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 26.4207" />
            </div>
            <div className="field">
              <label>Longitude</label>
              <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 50.0888" />
            </div>
          </div>
          <div className="field">
            <label>{t.hospital_description}</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={closeForm}>{t.btn_cancel}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{t.save}</button>
          </div>
        </form>
      )}

      <div className="hospital-grid" style={{ marginTop: 16 }}>
        {filtered.map((h) => (
          <div className="card hospital-card" key={h.id}>
            {h.photo_url
              ? <img className="avatar-photo" src={h.photo_url} alt={h.name} />
              : <div className="avatar">{initials(h.name)}</div>}
            <h3>{h.name}</h3>
            {h.address && <div className="addr">{h.address}</div>}
            {h.description && <p className="desc">{h.description}</p>}
            {h.phone && <p className="desc">{h.phone}</p>}
            {isAdmin && (
              <div className="doc-actions">
                <button className="btn btn-ghost" onClick={() => openForm(h)}>Edit</button>
                <button className="btn btn-danger" onClick={() => handleDelete(h.id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && !error && <div className="empty-state">{search ? 'No matching hospitals.' : t.no_hospitals}</div>}
    </section>
  )
}
