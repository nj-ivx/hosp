/* ==========================================================================
   supabaseClient.js
   Global Supabase configuration. Loaded before any other script on every
   page via:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="supabaseClient.js"></script>

   Exposes window.supabaseClient for use across auth.html, index.html,
   and form.html.
   ------------------------------------------------------------------------ */

(function () {
  const SUPABASE_URL = "https://aidsklvpzodubkxiwcjs.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZHNrbHZwem9kdWJreGl3Y2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMzY5MDAsImV4cCI6MjEwMDYxMjkwMH0.x31qbiI_U8PtpdiNMXolLtpr-Kps_bq6gcmGa1J5ymI";

  if (typeof window.supabase === "undefined") {
    console.error(
      "[supabaseClient] @supabase/supabase-js failed to load. " +
      "Check the CDN <script> tag is included before supabaseClient.js."
    );
    window.supabaseClient = null;
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  window.getUserRole = async function getUserRole() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return null;

    const { data, error } = await window.supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      console.error("[supabaseClient] role lookup failed:", error.message);
      return null;
    }
    return data ? data.role : null;
  };

  window.requireSession = async function requireSession(redirectTo) {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = redirectTo || "auth.html";
      return null;
    }
    return session;
  };
})();