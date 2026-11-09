-- The Admin PIN is a PBKDF2 hash written by the backend after the owner has
-- passed password and Google Authenticator verification. Never store the PIN
-- itself in Supabase or an environment variable.
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_pin_hash TEXT;
