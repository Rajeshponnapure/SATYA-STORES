-- The application stores the owner's authenticator secret on the owner user
-- record. These columns make that state durable in Supabase rather than only
-- keeping it in a single API process.
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
