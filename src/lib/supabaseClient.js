import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aidsklvpzodubkxiwcjs.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZHNrbHZwem9kdWJreGl3Y2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMzY5MDAsImV4cCI6MjEwMDYxMjkwMH0.x31qbiI_U8PtpdiNMXolLtpr-Kps_bq6gcmGa1J5ymI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})

/**
 * Fetch role, patient_key, hospital_id, and doctor_id for a user
 */
export async function getRoleInfo(userId) {
  if (!userId) return null
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, hospital_id, doctor_id, patient_key')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('Error fetching role info:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.error('getRoleInfo exception:', err)
    return null
  }
}

/**
 * Lookup patient by 8-character key (used by hospital staff & admins)
 */
export async function lookupPatientByKey(patientKey) {
  if (!patientKey || !patientKey.trim()) return null
  const cleanedKey = patientKey.trim().toUpperCase()
  
  try {
    // Attempt RPC first
    const { data: rpcUserId, error: rpcError } = await supabase
      .rpc('lookup_patient_by_key', { key: cleanedKey })

    let targetUserId = rpcUserId

    if (rpcError || !targetUserId) {
      // Direct lookup fallback
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('patient_key', cleanedKey)
        .maybeSingle()
      
      if (roleError || !roleData) return null
      targetUserId = roleData.user_id
    }

    // Fetch patient record details
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Fetch past appointments
    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        patient_name,
        patient_email,
        hospital_id,
        hospital_name,
        doctor_id,
        doctor_name,
        department,
        reason,
        status,
        created_at,
        visit_notes (*)
      `)
      .eq('user_id', targetUserId)
      .order('appointment_date', { ascending: false })

    return {
      userId: targetUserId,
      patientKey: cleanedKey,
      patient: patientData,
      appointments: appointmentsData || []
    }
  } catch (err) {
    console.error('lookupPatientByKey exception:', err)
    return null
  }
}

/**
 * Get all user roles for admin management
 */
export async function getAllUserRoles() {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_user_roles')
    if (!rpcError && rpcData) return rpcData

    // Fallback direct table query
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
    if (error) throw error
    return data
  } catch (err) {
    console.error('getAllUserRoles error:', err)
    return []
  }
}

/**
 * Admin update user role
 */
export async function adminUpdateUserRole(targetUserId, newRole, newHospitalId = null, newDoctorId = null) {
  try {
    const { data, error } = await supabase.rpc('admin_update_user_role', {
      target_user_id: targetUserId,
      new_role: newRole,
      new_hospital_id: newHospitalId || null,
      new_doctor_id: newDoctorId || null
    })

    if (error) {
      // Fallback to direct update if RPC fails
      const { error: directError } = await supabase
        .from('user_roles')
        .update({
          role: newRole,
          hospital_id: newHospitalId || null,
          doctor_id: newDoctorId || null
        })
        .eq('user_id', targetUserId)
      
      if (directError) throw directError
      return { success: true }
    }
    return { success: true, data }
  } catch (err) {
    console.error('adminUpdateUserRole error:', err)
    return { success: false, error: err.message }
  }
}
