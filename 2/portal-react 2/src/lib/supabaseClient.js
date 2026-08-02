import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://aidsklvpzodubkxiwcjs.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZHNrbHZwem9kdWJreGl3Y2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMzY5MDAsImV4cCI6MjEwMDYxMjkwMH0.x31qbiI_U8PtpdiNMXolLtpr-Kps_bq6gcmGa1J5ymI"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** Returns 'admin' | 'user' | null */
export async function getUserRole() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single()

  if (error) {
    console.error('[supabaseClient] role lookup failed:', error.message)
    return null
  }
  return data ? data.role : null
}
