-- A pending secret never replaces a working authenticator until its current
-- six-digit TOTP code is verified. Device-bound WebAuthn passkeys are kept
-- with the owner record for the single-owner deployment model.
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_pending_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_pending_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_passkeys JSONB NOT NULL DEFAULT '[]'::jsonb;
-- A short-lived, hashed approval code is created only on an already-approved
-- device. It lets the owner enroll a second physical device without allowing
-- a password plus TOTP alone to register an arbitrary new passkey.
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_device_enrollment_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_device_enrollment_expires_at TIMESTAMPTZ;
