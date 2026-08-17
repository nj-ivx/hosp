import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, getRoleInfo } from '../lib/supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState('user')
  const [hospitalId, setHospitalId] = useState(null)
  const [doctorId, setDoctorId] = useState(null)
  const [patientKey, setPatientKey] = useState(null)
  const [loading, setLoading] = useState(true)

  const syncUserRole = async (userId) => {
    if (!userId) {
      setRole('user')
      setHospitalId(null)
      setDoctorId(null)
      setPatientKey(null)
      return
    }

    try {
      const roleData = await getRoleInfo(userId)
      if (roleData) {
        setRole(roleData.role || 'user')
        setHospitalId(roleData.hospital_id || null)
        setDoctorId(roleData.doctor_id || null)
        setPatientKey(roleData.patient_key || null)
      } else {
        // Fallback default
        setRole('user')
      }
    } catch (err) {
      console.error('Error syncing user role:', err)
      setRole('user')
    }
  }

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(initialSession)
          setUser(initialSession?.user || null)
          if (initialSession?.user) {
            await syncUserRole(initialSession.user.id)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user || null)
      if (newSession?.user) {
        await syncUserRole(newSession.user.id)
      } else {
        setRole('user')
        setHospitalId(null)
        setDoctorId(null)
        setPatientKey(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    if (data.user) {
      await syncUserRole(data.user.id)
    }
    return data
  }

  const signUp = async (email, password, fullName = '') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    if (error) throw error
    if (data.user) {
      await syncUserRole(data.user.id)
    }
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setRole('user')
    setHospitalId(null)
    setDoctorId(null)
    setPatientKey(null)
  }

  const refreshRole = async () => {
    if (user?.id) {
      await syncUserRole(user.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        hospitalId,
        doctorId,
        patientKey,
        loading,
        signIn,
        signUp,
        signOut,
        refreshRole
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
