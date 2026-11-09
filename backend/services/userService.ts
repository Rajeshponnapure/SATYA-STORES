import crypto from "crypto";
import { getDatabase, saveDatabase, initialAdminProfile } from "../db/database";
import { User, Address, Review, AdminProfile } from "../types";
import { hashPassword, verifyPassword, generateOtp } from "../utils/auth";

interface PasswordResetToken {
  identifier: string;
  otp: string;
  expiresAt: number;
}

const passwordResetTokens = new Map<string, PasswordResetToken>();
const TOTP_ENCRYPTION_PREFIX = "enc:v1:";

function isValidProfileImage(value: string): boolean {
  if (value.startsWith("/uploads/")) return true;
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
  } catch {}
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/i.exec(value);
  if (!match) return false;
  const bytes = Buffer.from(match[2], "base64");
  return bytes.length > 0 && bytes.length <= 5 * 1024 * 1024;
}

// ==========================================
// RFC 6238 TOTP (External Authenticator Provider)
// Compatible with Google Authenticator, Microsoft Authenticator, Authy, Apple Passwords
// ==========================================
function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function encryptionKey(): Buffer {
  // A dedicated key is preferred. SESSION_SECRET is a safe fallback for a
  // smooth upgrade, because it is already mandatory for admin sessions.
  const material = process.env.TOTP_ENCRYPTION_KEY || process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!material || material.length < 32) throw new Error("A strong TOTP encryption key or session secret is required.");
  return crypto.createHash("sha256").update(`satya-stores:totp:v1:${material}`).digest();
}

function encryptTotpSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${TOTP_ENCRYPTION_PREFIX}${iv.toString("base64url")}:${ciphertext.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}`;
}

function decryptTotpSecret(stored: string): { secret: string; wasLegacyPlaintext: boolean } {
  if (!stored.startsWith(TOTP_ENCRYPTION_PREFIX)) return { secret: stored, wasLegacyPlaintext: true };
  const parts = stored.slice(TOTP_ENCRYPTION_PREFIX.length).split(":");
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) throw new Error("Stored authenticator secret is invalid.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(parts[0], "base64url"));
  decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
  const secret = Buffer.concat([decipher.update(Buffer.from(parts[1], "base64url")), decipher.final()]).toString("utf8");
  if (!/^[A-Z2-7]{16,128}$/.test(secret)) throw new Error("Stored authenticator secret is invalid.");
  return { secret, wasLegacyPlaintext: false };
}

function validateAdminPin(pin: string): string | undefined {
  if (!/^\d{10,12}$/.test(pin)) return "Admin PIN must contain exactly 10 to 12 digits.";
  if (/^(\d)\1+$/.test(pin)) return "Choose an Admin PIN that is not the same digit repeated.";
  if (["0123456789", "1234567890", "9876543210"].includes(pin)) return "Choose a less predictable Admin PIN.";
  return undefined;
}

function verifyTOTP(token: string, secret: string, window = 1, timeStep = 30): boolean {
  try {
    const epoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(epoch / timeStep);
    const key = base32Decode(secret);
    const cleanToken = token.trim();

    for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
      const counter = currentCounter + errorWindow;
      const buf = Buffer.alloc(8);
      buf.writeBigInt64BE(BigInt(counter));
      const hmac = crypto.createHmac("sha1", key).update(buf).digest();
      const offset = hmac[hmac.length - 1] & 0x0f;
      const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000)
        .toString()
        .padStart(6, "0");
      if (code === cleanToken) return true;
    }
    return false;
  } catch (err) {
    console.error("TOTP verification error:", err);
    return false;
  }
}

function generateTotpSecret(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = crypto.randomBytes(20);
  let bits = 0;
  let value = 0;
  let secret = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      secret += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) secret += alphabet[(value << (5 - bits)) & 31];
  return secret;
}

function ownerFromDatabase(db: Awaited<ReturnType<typeof getDatabase>>): User | undefined {
  return (db.users || []).find((user) => user.role === "owner");
}

export const userService = {
  // ==========================================
  // CUSTOMER & USER OPERATIONS
  // ==========================================
  async getAllUsers(search?: string): Promise<{ users: Omit<User, "password">[]; total: number }> {
    const db = await getDatabase();
    let users = db.users || [];

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.mobileNumber.includes(q)
      );
    }

    // Strip passwords before returning
    const safeUsers = users.map(({ password, twoFactorSecret, twoFactorPendingSecret, twoFactorPendingExpiresAt, adminPinHash, ...rest }) => rest);
    return { users: safeUsers, total: users.length };
  },

  async getUserById(id: string): Promise<Omit<User, "password"> | null> {
    const db = await getDatabase();
    const user = (db.users || []).find((u) => u.id === id);
    if (!user) return null;
    const { password, twoFactorSecret, twoFactorPendingSecret, twoFactorPendingExpiresAt, adminPinHash, ...safeUser } = user;
    return safeUser;
  },

  async registerUser(data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
  }): Promise<{ success: boolean; user?: Omit<User, "password">; error?: string }> {
    if (typeof data.fullName !== "string" || data.fullName.trim().length < 2 || data.fullName.length > 100 ||
      typeof data.email !== "string" || data.email.length > 254 ||
      typeof data.mobileNumber !== "string" || data.mobileNumber.length < 7 || data.mobileNumber.length > 24 ||
      typeof data.password !== "string" || data.password.length < 12 || data.password.length > 200) {
      return { success: false, error: "Account details or password do not meet requirements." };
    }
    const db = await getDatabase();
    const emailClean = data.email.trim().toLowerCase();
    const mobileClean = data.mobileNumber.trim();

    const existing = (db.users || []).find(
      (u) => u.email.toLowerCase() === emailClean || u.mobileNumber === mobileClean
    );

    if (existing) {
      return { success: false, error: "An account with this email or mobile number already exists." };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      fullName: data.fullName.trim(),
      email: emailClean,
      mobileNumber: mobileClean,
      password: hashPassword(data.password), // Securely hashed with PBKDF2 salt
      role: "customer",
      mobileVerified: true,
      emailVerified: true,
      accountStatus: "active",
      favorites: [],
      addresses: [],
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    await saveDatabase(db);

    const { password, twoFactorSecret, twoFactorPendingSecret, twoFactorPendingExpiresAt, adminPinHash, ...safeUser } = newUser;
    return { success: true, user: safeUser };
  },

  async login(
    emailOrPhone: string,
    passwordAttempt: string
  ): Promise<{
    success: boolean;
    user?: Omit<User, "password">;
    isAdmin?: boolean;
    error?: string;
  }> {
    const db = await getDatabase();
    const identifier = emailOrPhone.trim().toLowerCase();

    // Check if user exists in the database
    const user = (db.users || []).find(
      (u) =>
        u.email.toLowerCase() === identifier ||
        u.mobileNumber.replace(/\s+/g, "") === identifier.replace(/\s+/g, "") ||
        (u.role === "owner" && (identifier === "admin" || identifier === "admin@sathyastores.com"))
    );

    if (!user) {
      return {
        success: false,
        error: "No account found matching this email or mobile number.",
      };
    }

    if (user.accountStatus === "suspended") {
      return {
        success: false,
        error: "This account has been suspended by store administration.",
      };
    }

    const isMatch = verifyPassword(passwordAttempt, user.password);

    if (!isMatch) {
      return {
        success: false,
        error: "Incorrect password. Please verify and try again.",
      };
    }

    const { password, twoFactorSecret, twoFactorPendingSecret, twoFactorPendingExpiresAt, adminPinHash, ...safeUser } = user;
    return {
      success: true,
      user: safeUser,
      isAdmin: user.role === "owner",
    };
  },

  async adminUpdateUserPassword(
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 200) {
      return { success: false, error: "Password must be between 12 and 200 characters." };
    }
    const db = await getDatabase();
    const idx = (db.users || []).findIndex((u) => u.id === userId);
    if (idx === -1) {
      return { success: false, error: "User not found." };
    }

    // Save a versioned PBKDF2 hash.
    db.users[idx].password = hashPassword(newPassword);
    await saveDatabase(db);
    return { success: true };
  },

  async adminCreateUser(userData: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password?: string;
    role?: "customer" | "admin";
    accountStatus?: "active" | "suspended";
  }): Promise<{ success: boolean; user?: Omit<User, "password">; error?: string }> {
    const db = await getDatabase();
    const emailLower = userData.email.trim().toLowerCase();
    const cleanMobile = userData.mobileNumber.trim();

    if (!userData.fullName || !emailLower || !cleanMobile) {
      return { success: false, error: "Full Name, Email, and Mobile Number are required." };
    }

    const existingUser = (db.users || []).find(
      (u) => u.email.toLowerCase() === emailLower || u.mobileNumber.replace(/\s+/g, "") === cleanMobile.replace(/\s+/g, "")
    );
    if (existingUser) {
      return { success: false, error: "A user with this email or mobile number already exists." };
    }

    if (typeof userData.password !== "string" || userData.password.length < 12 || userData.password.length > 200 ||
      !["customer", "admin"].includes(userData.role || "customer")) {
      return { success: false, error: "Provide a password of at least 12 characters and a valid user role." };
    }
    const rawPassword = userData.password;
    const newUser: User = {
      id: `usr-${Date.now()}`,
      fullName: userData.fullName.trim(),
      email: emailLower,
      mobileNumber: cleanMobile,
      password: hashPassword(rawPassword),
      role: userData.role || "customer",
      mobileVerified: true,
      emailVerified: true,
      accountStatus: userData.accountStatus || "active",
      addresses: [],
      favorites: [],
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    await saveDatabase(db);

    const { password, twoFactorSecret, twoFactorPendingSecret, twoFactorPendingExpiresAt, adminPinHash, ...safeUser } = newUser;
    return { success: true, user: safeUser };
  },

  async adminUpdateUser(
    userId: string,
    updates: Partial<{
      fullName: string;
      email: string;
      mobileNumber: string;
      role: "customer" | "admin";
      accountStatus: "active" | "suspended";
    }>
  ): Promise<{ success: boolean; user?: Omit<User, "password">; error?: string }> {
    const db = await getDatabase();
    const idx = (db.users || []).findIndex((u) => u.id === userId);
    if (idx === -1) {
      return { success: false, error: "User not found." };
    }

    const current = db.users[idx];

    // Protect primary owner account from downgrade
    if (current.role === "owner" && updates.role) {
      return { success: false, error: "The primary store owner account role cannot be changed." };
    }
    if (current.role === "owner" && updates.accountStatus === "suspended") {
      return { success: false, error: "The primary store owner account cannot be suspended." };
    }

    if (updates.email) {
      const emailLower = updates.email.trim().toLowerCase();
      const conflict = (db.users || []).find((u) => u.id !== userId && u.email.toLowerCase() === emailLower);
      if (conflict) {
        return { success: false, error: "Email is already in use by another account." };
      }
      current.email = emailLower;
    }

    if (updates.mobileNumber) {
      current.mobileNumber = updates.mobileNumber.trim();
    }
    if (updates.fullName) {
      current.fullName = updates.fullName.trim();
    }
    if (updates.role && current.role !== "owner") {
      current.role = updates.role;
    }
    if (updates.accountStatus && current.role !== "owner") {
      current.accountStatus = updates.accountStatus;
    }

    await saveDatabase(db);
    const { password, twoFactorSecret, twoFactorPendingSecret, twoFactorPendingExpiresAt, adminPinHash, ...safeUser } = current;
    return { success: true, user: safeUser };
  },

  async adminDeleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();
    const target = (db.users || []).find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: "User not found." };
    }
    if (target.role === "owner") {
      return { success: false, error: "The primary store owner account cannot be deleted." };
    }

    db.users = (db.users || []).filter((u) => u.id !== userId);
    await saveDatabase(db);
    return { success: true };
  },

  async updateUserProfile(
    userId: string,
    updates: Partial<Pick<User, "fullName" | "mobileNumber" | "addresses" | "profileImage">>
  ): Promise<{ success: boolean; user?: Omit<User, "password">; error?: string }> {
    if (updates.profileImage !== undefined && !isValidProfileImage(updates.profileImage)) {
      return { success: false, error: "Profile image must be a JPG, PNG, or WebP image up to 5 MB." };
    }
    const db = await getDatabase();
    const idx = (db.users || []).findIndex((u) => u.id === userId);
    if (idx === -1) {
      return { success: false, error: "User not found." };
    }

    db.users[idx] = { ...db.users[idx], ...updates };
    await saveDatabase(db);
    const { password, twoFactorSecret, twoFactorPendingSecret, twoFactorPendingExpiresAt, adminPinHash, ...safeUser } = db.users[idx];
    return { success: true, user: safeUser };
  },

  // ==========================================
  // FORGOT PASSWORD & RESET FLOW
  // ==========================================
  async requestPasswordReset(
    emailOrPhone: string
  ): Promise<{ success: boolean; message?: string; simulatedOtp?: string; error?: string }> {
    const db = await getDatabase();
    const identifier = emailOrPhone.trim().toLowerCase();

    const user = (db.users || []).find(
      (u) =>
        u.email.toLowerCase() === identifier ||
        u.mobileNumber.replace(/\s+/g, "") === identifier.replace(/\s+/g, "")
    );

    if (!user) {
      return {
        success: false,
        error: "No account exists with this email address or mobile number.",
      };
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    passwordResetTokens.set(identifier, {
      identifier,
      otp,
      expiresAt,
    });

    return {
      success: true,
      message: `A 6-digit verification code has been sent to your registered contact.`,
      simulatedOtp: otp, // Returned for instant feedback & zero-cost testing
    };
  },

  async resetPassword(
    emailOrPhone: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 200) {
      return { success: false, error: "Password must be between 12 and 200 characters." };
    }
    const db = await getDatabase();
    const identifier = emailOrPhone.trim().toLowerCase();
    const tokenRecord = passwordResetTokens.get(identifier);

    if (!tokenRecord) {
      return {
        success: false,
        error: "Reset session expired or invalid. Please request a new verification code.",
      };
    }

    if (Date.now() > tokenRecord.expiresAt) {
      passwordResetTokens.delete(identifier);
      return {
        success: false,
        error: "Verification code has expired. Please request a new code.",
      };
    }

    if (tokenRecord.otp !== otp.trim()) {
      return {
        success: false,
        error: "Invalid 6-digit verification code. Please check and try again.",
      };
    }

    const userIdx = (db.users || []).findIndex(
      (u) =>
        u.email.toLowerCase() === identifier ||
        u.mobileNumber.replace(/\s+/g, "") === identifier.replace(/\s+/g, "")
    );

    if (userIdx === -1) {
      return { success: false, error: "User account could not be located." };
    }

    db.users[userIdx].password = hashPassword(newPassword);
    await saveDatabase(db);
    passwordResetTokens.delete(identifier);

    return {
      success: true,
      message: "Password has been successfully updated. You may now sign in.",
    };
  },

  // ==========================================
  // ADMIN PROFILE & TWO-FACTOR AUTH (2FA)
  // ==========================================
  async getAdminProfile(): Promise<AdminProfile> {
    const db = await getDatabase();
    if (!db.adminProfile) {
      db.adminProfile = initialAdminProfile;
      await saveDatabase(db);
    }
    // Mask security PIN for safe viewing
    return {
      ...db.adminProfile,
      twoFactorSecret: undefined,
      twoFactorPin: db.adminProfile.twoFactorPin ? "******" : undefined,
    };
  },

  async updateAdminProfile(updates: Partial<AdminProfile>): Promise<{ success: boolean; profile: AdminProfile }> {
    if (updates.profileImage !== undefined && !isValidProfileImage(updates.profileImage)) {
      throw new Error("Profile image must be a JPG, PNG, or WebP image up to 5 MB.");
    }
    const db = await getDatabase();
    if (!db.adminProfile) {
      db.adminProfile = initialAdminProfile;
    }

    db.adminProfile = {
      ...db.adminProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Also sync admin user record if email or name changes
    const adminUser = (db.users || []).find((u) => u.role === "owner");
    if (adminUser) {
      if (updates.fullName) adminUser.fullName = updates.fullName;
      if (updates.email) adminUser.email = updates.email;
      if (updates.mobileNumber) adminUser.mobileNumber = updates.mobileNumber;
    }

    await saveDatabase(db);
    return { success: true, profile: { ...db.adminProfile, twoFactorSecret: undefined, twoFactorPin: undefined } };
  },

  async getAdminSecurityStatus(): Promise<{ success: boolean; twoFactorEnabled: boolean; adminPinConfigured: boolean }> {
    const db = await getDatabase();
    const adminUser = ownerFromDatabase(db);
    if (!adminUser) throw new Error("Administrative account is not configured.");
    return {
      success: true,
      twoFactorEnabled: Boolean(adminUser.twoFactorEnabled && adminUser.twoFactorSecret),
      adminPinConfigured: Boolean(adminUser.adminPinHash),
    };
  },

  /**
   * Starts, or replaces, a pending TOTP enrollment. A generated secret is
   * deliberately not active until its current six-digit code is verified.
   */
  async beginAdminTotpSetup(): Promise<{
    success: boolean;
    secret: string;
    otpauthUri: string;
    issuer: string;
    account: string;
    expiresAt: string;
  }> {
    const db = await getDatabase();
    const adminUser = ownerFromDatabase(db);
    if (!adminUser) throw new Error("Administrative account is not configured.");

    const secret = generateTotpSecret();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    adminUser.twoFactorPendingSecret = encryptTotpSecret(secret);
    adminUser.twoFactorPendingExpiresAt = expiresAt;
    await saveDatabase(db);

    const account = adminUser.email || "admin@sathyastores.com";
    const issuer = "Satya Stores";
    const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    return { success: true, secret, otpauthUri, issuer, account, expiresAt };
  },

  async confirmAdminTotpSetup(code: string): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();
    const adminUser = ownerFromDatabase(db);
    const storedSecret = adminUser?.twoFactorPendingSecret;
    const expiresAt = adminUser?.twoFactorPendingExpiresAt ? Date.parse(adminUser.twoFactorPendingExpiresAt) : 0;
    if (!adminUser || !storedSecret || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
      return { success: false, error: "This QR setup has expired. Generate a fresh QR code and scan it again." };
    }
    let secret: string;
    try {
      secret = decryptTotpSecret(storedSecret).secret;
    } catch {
      return { success: false, error: "Authenticator setup is unavailable. Generate a fresh QR code and try again." };
    }
    if (!verifyTOTP(code, secret)) {
      return { success: false, error: "The code does not match this QR setup. Wait for a fresh code and try again." };
    }

    adminUser.twoFactorSecret = encryptTotpSecret(secret);
    adminUser.twoFactorEnabled = true;
    adminUser.twoFactorPendingSecret = undefined;
    adminUser.twoFactorPendingExpiresAt = undefined;
    await saveDatabase(db);
    return { success: true };
  },

  async verifyAdminTotp(code: string): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();
    const adminUser = ownerFromDatabase(db);
    if (!adminUser?.twoFactorEnabled || !adminUser.twoFactorSecret) {
      return { success: false, error: "Set up Google Authenticator before continuing." };
    }
    try {
      const { secret, wasLegacyPlaintext } = decryptTotpSecret(adminUser.twoFactorSecret);
      const valid = verifyTOTP(code, secret);
      // Existing setups from before encrypted storage are upgraded after their
      // owner proves possession of the current authenticator code.
      if (valid && wasLegacyPlaintext) {
        adminUser.twoFactorSecret = encryptTotpSecret(secret);
        await saveDatabase(db);
      }
      return valid
        ? { success: true }
        : { success: false, error: "Enter the current 6-digit code from your authenticator app." };
    } catch {
      return { success: false, error: "Authenticator verification is unavailable. Generate a new QR code from an existing admin session." };
    }
  },

  async setInitialAdminPin(pin: string): Promise<{ success: boolean; error?: string }> {
    const validationError = validateAdminPin(pin);
    if (validationError) return { success: false, error: validationError };
    const db = await getDatabase();
    const adminUser = ownerFromDatabase(db);
    if (!adminUser) return { success: false, error: "Administrative account is not configured." };
    if (adminUser.adminPinHash) return { success: false, error: "An Admin PIN is already configured." };
    adminUser.adminPinHash = hashPassword(pin);
    await saveDatabase(db);
    return { success: true };
  },

  async verifyAdminPin(pin: string): Promise<{ success: boolean; error?: string }> {
    if (!/^\d{10,12}$/.test(pin)) return { success: false, error: "Enter your 10 to 12 digit Admin PIN." };
    const db = await getDatabase();
    const adminUser = ownerFromDatabase(db);
    if (!adminUser?.adminPinHash) return { success: false, error: "Set up an Admin PIN before continuing." };
    return verifyPassword(pin, adminUser.adminPinHash)
      ? { success: true }
      : { success: false, error: "The Admin PIN is not correct." };
  },

  async changeAdminPin(currentPin: string, newPin: string, totpCode: string): Promise<{ success: boolean; error?: string }> {
    const validationError = validateAdminPin(newPin);
    if (validationError) return { success: false, error: validationError };
    const totp = await this.verifyAdminTotp(totpCode);
    if (!totp.success) return totp;
    const db = await getDatabase();
    const adminUser = ownerFromDatabase(db);
    if (!adminUser?.adminPinHash || !verifyPassword(currentPin, adminUser.adminPinHash)) {
      return { success: false, error: "Current Admin PIN is not correct." };
    }
    adminUser.adminPinHash = hashPassword(newPin);
    await saveDatabase(db);
    return { success: true };
  },

  async generateAdmin2fa(): Promise<{ success: boolean; otp: string; message: string; provider: string }> {
    return { success: false, otp: "", provider: "Unavailable", message: "OTP delivery is not configured. Use an authenticator app instead." };
  },

  async verifyAdmin2faCode(code: string): Promise<{ success: boolean; valid: boolean; method?: string; error?: string }> {
    const result = await this.verifyAdminTotp(code);
    return result.success
      ? { success: true, valid: true, method: "Google Authenticator compatible TOTP" }
      : { success: false, valid: false, error: result.error };
  },

  async adminChangePasswordWith2FA(
    currentPasswordAttempt: string,
    newPassword: string,
    twoFactorCode: string
  ): Promise<{ success: boolean; error?: string; methodUsed?: string }> {
    if (typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 200) {
      return { success: false, error: "Password must be between 12 and 200 characters." };
    }
    const db = await getDatabase();
    const adminUser = (db.users || []).find((u) => u.role === "owner");

    if (!adminUser) {
      return { success: false, error: "Administrative account not found." };
    }

    // 1. Verify current password
    const isCurrentMatch = verifyPassword(currentPasswordAttempt, adminUser.password);
    if (!isCurrentMatch) {
      return { success: false, error: "Current admin password is incorrect." };
    }

    // 2. Verify the current RFC 6238 authenticator code.
    const cleanCode = twoFactorCode.trim();
    const storedSecret = adminUser.twoFactorSecret;
    if (!adminUser.twoFactorEnabled || !storedSecret) return { success: false, error: "Set up an authenticator app first." };

    let isTotpValid = false;
    try {
      const { secret, wasLegacyPlaintext } = decryptTotpSecret(storedSecret);
      isTotpValid = verifyTOTP(cleanCode, secret);
      if (isTotpValid && wasLegacyPlaintext) adminUser.twoFactorSecret = encryptTotpSecret(secret);
    } catch {
      return { success: false, error: "Authenticator verification is unavailable. Generate a new QR code from an existing admin session." };
    }
    if (!isTotpValid) {
      return {
        success: false,
        error: "Invalid Two-Factor Authentication (2FA) code. Enter the current 6-digit code from your authenticator app.",
      };
    }

    const methodUsed = "External Authenticator App (RFC 6238 TOTP)";

    // 3. Hash and save new password
    adminUser.password = hashPassword(newPassword);
    await saveDatabase(db);

    return { success: true, methodUsed };
  },

  // ==========================================
  // REVIEWS & FAVORITES
  // ==========================================
  async toggleFavorite(
    userId: string,
    productId: string
  ): Promise<{ success: boolean; favorites: string[] }> {
    const db = await getDatabase();
    const user = (db.users || []).find((u) => u.id === userId);
    if (!user) {
      return { success: false, favorites: [] };
    }

    const favs = new Set(user.favorites || []);
    if (favs.has(productId)) {
      favs.delete(productId);
    } else {
      favs.add(productId);
    }

    user.favorites = Array.from(favs);
    await saveDatabase(db);
    return { success: true, favorites: user.favorites };
  },

  async addReview(reviewData: Omit<Review, "id" | "createdAt">): Promise<{ success: boolean; review: Review }> {
    const db = await getDatabase();
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (!db.reviews) db.reviews = [];
    db.reviews.unshift(newReview);

    // Update product rating
    const product = db.products.find((p) => p.id === reviewData.productId);
    if (product) {
      const prodReviews = db.reviews.filter((r) => r.productId === reviewData.productId);
      const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      product.rating = Number(avg.toFixed(1));
      product.reviewCount = prodReviews.length;
    }

    await saveDatabase(db);
    return { success: true, review: newReview };
  },

  async getProductReviews(productId: string): Promise<Review[]> {
    const db = await getDatabase();
    return (db.reviews || []).filter((r) => r.productId === productId);
  },
};
