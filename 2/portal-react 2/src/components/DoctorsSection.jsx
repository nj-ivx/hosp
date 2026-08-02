import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabaseClient'

function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function parseCsv(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  return lines.slice(1).filter(Boolean).map((line) => {
    const cells = line.split(',').map((c) => c.trim())
    const row = {}
    headers.forEach((h, i) => { row[h] = cells[i] || '' })
    return row
  })
}

export default function DoctorsSection({ isAdmin, hospitals }) {
  const { t } = useLang()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)
  const [doctors, setDoctors] = useState([])
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [name, setName] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [department, setDepartment] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [bio, setBio] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    try {
      const { data, error } = await supabase.from('doctors').select('*').order('created_at', { ascending: true })
      if (error) throw error
      setDoctors(data || [])
    } catch (err) {
      setError('Couldn\'t load doctors right now.')
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return doctors
    return doctors.filter((d) =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.specialty || '').toLowerCase().includes(q) ||
      (d.department || '').toLowerCase().includes(q)
    )
  }, [doctors, search])

  function openForm(doc) {
    setEditId(doc ? doc.id : '')
    setName(doc ? doc.name || '' : '')
    setHospitalId(doc ? doc.hospital_id || '' : '')
    setDepartment(doc ? doc.department || '' : '')
    setSpecialty(doc ? doc.specialty || '' : '')
    setBio(doc ? doc.bio || '' : '')
    setPhotoUrl(doc ? doc.photo_url || '' : '')
    setFormOpen(true)
  }
  function closeForm() { setFormOpen(false) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const record = { name, hospital_id: hospitalId || null, department, specialty, bio, photo_url: photoUrl }
    try {
      const { error } = editId
        ? await supabase.from('doctors').update(record).eq('id', editId)
        : await supabase.from('doctors').insert([record])
      if (error) throw error
      showToast(editId ? 'Doctor updated.' : 'Doctor added.')
      closeForm()
      await load()
    } catch (err) {
      showToast('Couldn\'t save that doctor.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this doctor?')) return
    try {
      const { error } = await supabase.from('doctors').delete().eq('id', id)
      if (error) throw error
      showToast('Doctor removed.')
      await load()
    } catch (err) {
      showToast('Couldn\'t remove that doctor right now.', 'error')
    }
  }

  async function handleCsvImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      const records = rows.map((r) => {
        const hospital = hospitals.find((h) => h.name.toLowerCase() === (r.hospital || '').toLowerCase())
        return {
          name: r.name || '',
          department: r.department || '',
          specialty: r.specialty || '',
          bio: r.bio || '',
          photo_url: r.photo_url || '',
          hospital_id: hospital ? hospital.id : null,
        }
      }).filter((r) => r.name)
      if (records.length === 0) {
        showToast('No valid rows found in that CSV.', 'error')
        return
      }
      const { error } = await supabase.from('doctors').insert(records)
      if (error) throw error
      showToast(`Imported ${records.length} doctor(s).`)
      await load()
    } catch (err) {
      showToast('Could not import that CSV file.', 'error')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{t.doctors_title}</h2>
        {isAdmin && (
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>Import CSV</button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
            <button className="btn btn-ghost" onClick={() => (formOpen ? closeForm() : openForm(null))}>
              {t.add_doctor}
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="filter-bar">
        <input placeholder="Search by name, specialty, or department…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {formOpen && (
        <form className="card" onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="field">
              <label>{t.doctor_name}</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>{t.label_hospital}</label>
              <select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
                <option value="">{t.select_option}</option>
                {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>{t.doctor_department}</label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
            <div className="field">
              <label>{t.doctor_specialty}</label>
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Photo URL</label>
            <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="field">
            <label>{t.doctor_bio}</label>
            <textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={closeForm}>{t.btn_cancel}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{t.save}</button>
          </div>
        </form>
      )}

      <div className="doctor-grid" style={{ marginTop: 16 }}>
        {filtered.map((doc) => {
          const hospital = hospitals.find((h) => h.id === doc.hospital_id)
          return (
            <div className="card doctor-card" key={doc.id}>
              {doc.photo_url
                ? <img className="avatar-photo" src={doc.photo_url} alt={doc.name} />
                : <div className="avatar">{initials(doc.name)}</div>}
              <h3>{doc.name}</h3>
              <div className="dept">{doc.department || doc.specialty || ''}</div>
              {hospital && <p className="bio" style={{ fontWeight: 600, color: 'var(--ink)' }}>{hospital.name}</p>}
              {doc.bio && <p className="bio">{doc.bio}</p>}
              {isAdmin && (
                <div className="doc-actions">
                  <button className="btn btn-ghost" onClick={() => openForm(doc)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(doc.id)}>Delete</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {filtered.length === 0 && !error && <div className="empty-state">{search ? 'No matching doctors.' : t.no_doctors}</div>}
    </section>
  )
}
