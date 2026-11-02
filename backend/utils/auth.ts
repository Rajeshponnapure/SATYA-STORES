import crypto from "crypto";

/**
 * Hashes a plaintext password using PBKDF2 with a cryptographically secure random 16-byte salt.
 * Result format: `<hex_salt>:<hex_hash>`
 */
export function hashPassword(password: string): string {
  if (!password) return "";
  // If already hashed (contains salt:hash delimiter and long length), don't rehash
  if (password.includes(":") && password.length > 80) {
    return password;
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a salt:hash string (with legacy plaintext fallback).
 */
export function verifyPassword(password: string, combinedHash?: string): boolean {
  if (!combinedHash || !password) return false;
  // Fallback for legacy plain text entries during transition
  if (!combinedHash.includes(":")) {
    return password === combinedHash;
  }
  const parts = combinedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

/**
 * Generates a random 6-digit numeric verification code (for 2FA / OTP).
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

