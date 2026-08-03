import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getRoleInfo } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading, null = signed out
  const [role, setRole] = useState(null)
  const [hospitalId, setHospitalId] = useState(null)
  const [patientKey, setPatientKey] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (!session) {
      setRole(null)
      setHospitalId(null)
      setPatientKey(null)
      setRoleLoading(false)
      return
    }
    setRoleLoading(true)
    getRoleInfo()
      .then(({ role, hospitalId, patientKey }) => {
        setRole(role)
        setHospitalId(hospitalId)
        setPatientKey(patientKey)
      })
      .finally(() => setRoleLoading(false))
  }, [session])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session, role, hospitalId, patientKey,
      loading: session === undefined || roleLoading, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
