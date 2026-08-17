import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useToast } from '../context/ToastContext'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function IntakeForm() {
  const { user } = useAuth()
  const { t } = useLang()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: user?.email || '',
    address: '',
    blood_type: 'O+',
    weight: '',
    allergies: '',
    medications: '',
    conditions: '',
    insurance_provider: '',
    policy_number: ''
  })

  // Load existing record if editing
  useEffect(() => {
    async function loadRecord() {
      if (!editId) {
        if (user?.email && !form.email) {
          setForm(prev => ({ ...prev, email: user.email }))
        }
        return
      }

      try {
        setFetching(true)
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', editId)
          .single()

        if (error) throw error
        if (data) {
          setForm({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            dob: data.dob || '',
            gender: data.gender || 'Male',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            blood_type: data.blood_type || 'O+',
            weight: data.weight !== null ? data.weight : '',
            allergies: data.allergies || '',
            medications: data.medications || '',
            conditions: data.conditions || '',
            insurance_provider: data.insurance_provider || '',
            policy_number: data.policy_number || ''
          })
        }
      } catch (err) {
        console.error('Error fetching record:', err)
        showToast(err.message, 'error')
      } finally {
        setFetching(false)
      }
    }

    loadRecord()
  }, [editId, user?.email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim()) {
      showToast('First and last name are required', 'warning')
      return
    }

    try {
      setLoading(true)

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        dob: form.dob || null,
        gender: form.gender || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        blood_type: form.blood_type || null,
        weight: form.weight !== '' ? parseFloat(form.weight) : null,
        allergies: form.allergies.trim() || null,
        medications: form.medications.trim() || null,
        conditions: form.conditions.trim() || null,
        insurance_provider: form.insurance_provider.trim() || null,
        policy_number: form.policy_number.trim() || null,
        user_id: user?.id || null
      }

      if (editId) {
        const { error } = await supabase
          .from('patients')
          .update(payload)
          .eq('id', editId)

        if (error) throw error
        showToast(t('intakeUpdateSuccess'), 'success')
      } else {
        const { error } = await supabase
          .from('patients')
          .insert(payload)

        if (error) throw error
        showToast(t('intakeSubmitSuccess'), 'success')
      }

      navigate('/dashboard')
    } catch (err) {
      console.error('Submission error:', err)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        {t('loading')}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {editId ? t('intakeTitleEdit') : t('intakeTitleNew')}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {t('intakeSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Section 1: Personal Details */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-light)', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              {t('sectionPersonal')}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('firstName')} *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('lastName')} *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('dob')} *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('gender')} *</label>
                <select
                  className="form-select"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="Male">{t('male')}</option>
                  <option value="Female">{t('female')}</option>
                  <option value="Other">{t('other')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('phone')} *</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  placeholder="+966 5X XXX XXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('email')} *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('address')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="District, City, Country"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>

          {/* Section 2: Clinical Background */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-light)', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              {t('sectionClinical')}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('bloodType')} *</label>
                <select
                  className="form-select"
                  value={form.blood_type}
                  onChange={(e) => setForm({ ...form, blood_type: e.target.value })}
                >
                  {BLOOD_TYPES.map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('weight')}</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 74.5"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('allergies')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('allergiesHelp')}
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('medications')}</label>
              <textarea
                className="form-textarea"
                placeholder={t('medicationsHelp')}
                value={form.medications}
                onChange={(e) => setForm({ ...form, medications: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('conditions')}</label>
              <textarea
                className="form-textarea"
                placeholder={t('conditionsHelp')}
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              />
            </div>
          </div>

          {/* Section 3: Insurance Info */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-light)', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              {t('sectionInsurance')}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('insuranceProvider')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bupa Arabia, Tawuniya, MedGulf"
                  value={form.insurance_provider}
                  onChange={(e) => setForm({ ...form, insurance_provider: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('policyNumber')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. POL-984210"
                  value={form.policy_number}
                  onChange={(e) => setForm({ ...form, policy_number: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem' }}
            >
              {loading ? t('processing') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
