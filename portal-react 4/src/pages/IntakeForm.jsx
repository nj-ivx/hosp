import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabaseClient'
import Nav from '../components/Nav'
import VitalLine from '../components/VitalLine'

const initialForm = {
  first_name: '', last_name: '', dob: '', gender: '', phone: '', email: '', address: '',
  blood_type: '', weight: '', allergies: '', medications: '', conditions: '',
  insurance_provider: '', policy_number: '',
}

export default function IntakeForm() {
  const { t } = useLang()
  const { session } = useAuth()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')

  const [form, setForm] = useState(initialForm)
  const [alert, setAlert] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loadingRecord, setLoadingRecord] = useState(!!editId)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!editId) return
    async function loadRecord() {
      try {
        const { data, error } = await supabase.from('patients').select('*').eq('id', editId).single()
        if (error) throw error
        setForm({
          first_name: data.first_name || '', last_name: data.last_name || '', dob: data.dob || '',
          gender: data.gender || '', phone: data.phone || '', email: data.email || '', address: data.address || '',
          blood_type: data.blood_type || '', weight: data.weight ?? '', allergies: data.allergies || '',
          medications: data.medications || '', conditions: data.conditions || '',
          insurance_provider: data.insurance_provider || '', policy_number: data.policy_number || '',
        })
      } catch (err) {
        setAlert("Couldn't load that record. It may not exist or you may not have access to it.")
      } finally {
        setLoadingRecord(false)
      }
    }
    loadRecord()
  }, [editId])

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    setBusy(true)
    try {
      const record = { ...form, weight: form.weight ? Number(form.weight) : null, user_id: session?.user?.id || null }
      const { error } = editId
        ? await supabase.from('patients').update(record).eq('id', editId)
        : await supabase.from('patients').insert([record])
      if (error) throw error
      showToast(editId ? 'Record updated.' : 'Record submitted.')
      setSuccess(true)
    } catch (err) {
      setAlert(err.message || "Couldn't save the form. Please check your entries and try again.")
    } finally {
      setBusy(false)
    }
  }

  if (loadingRecord) {
    return (
      <div className="page">
        <Nav showRoleBadge />
        <VitalLine />
        <main className="container form-shell">
          <div className="skeleton skeleton-bar" style={{ width: 200 }} />
          <div className="skeleton skeleton-card" style={{ marginTop: 16 }} />
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <Nav showRoleBadge />
      <VitalLine />
      <main className="container form-shell">
        <Link className="back-link" to="/dashboard">{t.back_dashboard}</Link>

        {!success && (
          <>
            <div className="form-head">
              <h1>{editId ? 'Edit Patient Record' : t.intake_title}</h1>
              <p className="muted">{t.intake_sub}</p>
            </div>

            {alert && <div className="alert alert-error" role="alert">{alert}</div>}

            <form className="card" style={{ padding: 28 }} onSubmit={handleSubmit}>
              <fieldset>
                <legend>{t.section_personal}</legend>
                <div className="grid-2">
                  <div className="field">
                    <label>{t.label_first_name} *</label>
                    <input required value={form.first_name} onChange={update('first_name')} />
                  </div>
                  <div className="field">
                    <label>{t.label_last_name} *</label>
                    <input required value={form.last_name} onChange={update('last_name')} />
                  </div>
                </div>
                <div className="grid-3">
                  <div className="field">
                    <label>{t.label_dob} *</label>
                    <input type="date" required value={form.dob} onChange={update('dob')} />
                  </div>
                  <div className="field">
                    <label>{t.label_gender}</label>
                    <select value={form.gender} onChange={update('gender')}>
                      <option value="">{t.select_option}</option>
                      <option>Female</option><option>Male</option><option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>{t.label_phone} *</label>
                    <input type="tel" required value={form.phone} onChange={update('phone')} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>{t.label_email} *</label>
                    <input type="email" required value={form.email} onChange={update('email')} />
                  </div>
                  <div className="field">
                    <label>{t.label_address}</label>
                    <input value={form.address} onChange={update('address')} />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>{t.section_medical}</legend>
                <div className="grid-2">
                  <div className="field">
                    <label>{t.label_blood_type}</label>
                    <select value={form.blood_type} onChange={update('blood_type')}>
                      <option value="">Unknown</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>{t.label_weight}</label>
                    <input type="number" min="0" step="0.1" value={form.weight} onChange={update('weight')} />
                  </div>
                </div>
                <div className="field">
                  <label>{t.label_allergies}</label>
                  <textarea rows={2} placeholder="e.g. Penicillin, peanuts" value={form.allergies} onChange={update('allergies')} />
                </div>
                <div className="field">
                  <label>{t.label_medications}</label>
                  <textarea rows={2} value={form.medications} onChange={update('medications')} />
                </div>
                <div className="field">
                  <label>{t.label_conditions}</label>
                  <textarea rows={2} value={form.conditions} onChange={update('conditions')} />
                </div>
              </fieldset>

              <fieldset>
                <legend>{t.section_insurance}</legend>
                <div className="grid-2">
                  <div className="field">
                    <label>{t.label_provider}</label>
                    <input value={form.insurance_provider} onChange={update('insurance_provider')} />
                  </div>
                  <div className="field">
                    <label>{t.label_policy}</label>
                    <input value={form.policy_number} onChange={update('policy_number')} />
                  </div>
                </div>
              </fieldset>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 12 }}>
                <Link className="btn btn-ghost" to="/dashboard">{t.btn_cancel}</Link>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : (editId ? 'Save Changes' : t.btn_submit_intake)}
                </button>
              </div>
            </form>
          </>
        )}

        {success && (
          <div className="success-screen card">
            <span className="icon">✅</span>
            <h2>{editId ? 'Record updated' : t.intake_success_title}</h2>
            <p className="muted">{t.intake_success_desc}</p>
            <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
              <Link className="btn btn-primary" to="/dashboard">{t.back_dashboard}</Link>
              {!editId && (
                <button className="btn btn-ghost" onClick={() => { setForm(initialForm); setSuccess(false) }}>
                  {t.btn_submit_another}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
