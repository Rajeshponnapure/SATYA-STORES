// Safe dynamic require of @supabase/supabase-js to prevent module resolution crashes
let createClient: any = null;
try {
  const mod = require("@supabase/supabase-js");
  createClient = mod.createClient || mod.default?.createClient;
} catch {
  // @supabase/supabase-js is not installed or unavailable in this runtime
}

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const backendSupabaseSecretKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY ||
  "";

// An anon key is useful only for local experimentation. Production APIs need a
// server-only credential because they enforce authorization themselves and RLS
// intentionally denies direct client access.
const supabaseSecretKey = backendSupabaseSecretKey || (
  process.env.NODE_ENV === "production"
    ? ""
    : process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export const isSupabaseConfigured = Boolean(
  createClient &&
  supabaseUrl &&
  supabaseSecretKey &&
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("your-project")
);

export const supabase: any = isSupabaseConfigured && createClient
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
