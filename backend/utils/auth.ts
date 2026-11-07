import crypto from "crypto";

/**
 * Hashes a plaintext password using PBKDF2 with a cryptographically secure random 16-byte salt.
 * Result format: `<hex_salt>:<hex_hash>`
 */
export function hashPassword(password: string): string {
  if (!password) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 210000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

/**
 * Verifies a plaintext password against a salt:hash string (with legacy plaintext fallback).
 */
export function verifyPassword(password: string, combinedHash?: string): boolean {
  if (!combinedHash || !password) return false;
  if (combinedHash.startsWith("pbkdf2$")) {
    const [, iterationsText, salt, originalHash] = combinedHash.split("$");
    const iterations = Number(iterationsText);
    if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000 || !salt || !/^[a-f0-9]{128}$/i.test(originalHash || "")) return false;
    const actual = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512");
    const expected = Buffer.from(originalHash, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  }
  if (!combinedHash.includes(":")) return process.env.NODE_ENV !== "production" && password === combinedHash;
  const parts = combinedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512");
  const expected = Buffer.from(originalHash, "hex");
  return hash.length === expected.length && crypto.timingSafeEqual(hash, expected);
}

/**
 * Generates a random 6-digit numeric verification code (for 2FA / OTP).
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}
