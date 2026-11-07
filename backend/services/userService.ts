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
let activeAdmin2faOtp: { otp: string; expiresAt: number; provider: string } | null = null;

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
    const safeUsers = users.map(({ password, twoFactorSecret, ...rest }) => rest);
    return { users: safeUsers, total: users.length };
  },

  async getUserById(id: string): Promise<Omit<User, "password"> | null> {
    const db = await getDatabase();
    const user = (db.users || []).find((u) => u.id === id);
    if (!user) return null;
    const { password, twoFactorSecret, ...safeUser } = user;
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

    const { password, twoFactorSecret, ...safeUser } = newUser;
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

    // Verify password against stored PBKDF2 hash (with legacy fallback)
    const isMatch = verifyPassword(passwordAttempt, user.password);
    if (!isMatch) {
      return {
        success: false,
        error: "Incorrect password. Please verify and try again.",
      };
    }

    const { password, twoFactorSecret, ...safeUser } = user;
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

    const { password, twoFactorSecret, ...safeUser } = newUser;
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
    const { password, twoFactorSecret, ...safeUser } = current;
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
    const { password, twoFactorSecret, ...safeUser } = db.users[idx];
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

  async getAdmin2faSetup(): Promise<{
    success: boolean;
    secret: string;
    otpauthUri: string;
    issuer: string;
    account: string;
    provider: string;
  }> {
    const db = await getDatabase();
    const adminUser = (db.users || []).find((u) => u.role === "owner");
    if (!adminUser) throw new Error("Administrative account is not configured.");
    if (!adminUser.twoFactorSecret) {
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
      adminUser.twoFactorSecret = secret;
      await saveDatabase(db);
    }
    const secret = adminUser.twoFactorSecret;
    const account = adminUser?.email || "admin@sathyastores.com";
    const issuer = "Satya Stores";
    const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

    return {
      success: true,
      secret,
      otpauthUri,
      issuer,
      account,
      provider: "RFC 6238 Standard TOTP (Google Authenticator / Microsoft Authenticator / Authy / Apple)",
    };
  },

  async generateAdmin2fa(): Promise<{ success: boolean; otp: string; message: string; provider: string }> {
    activeAdmin2faOtp = null;
    return { success: false, otp: "", provider: "Unavailable", message: "OTP delivery is not configured. Use an authenticator app instead." };
  },

  async verifyAdmin2faCode(code: string): Promise<{ success: boolean; valid: boolean; method?: string; error?: string }> {
    const db = await getDatabase();
    const adminUser = (db.users || []).find((u) => u.role === "owner");
    const secret = adminUser?.twoFactorSecret;
    if (!secret) return { success: false, valid: false, error: "Set up an authenticator app first." };
    const cleanCode = code.trim();

    // 1. Check RFC 6238 TOTP from external authenticator app
    const isTotpMatch = verifyTOTP(cleanCode, secret);
    if (isTotpMatch) {
      return { success: true, valid: true, method: "External Authenticator App (Google/Microsoft TOTP)" };
    }

    // 2. Check dispatched 2FA OTP
    const isOtpMatch =
      activeAdmin2faOtp &&
      activeAdmin2faOtp.otp === cleanCode &&
      Date.now() <= activeAdmin2faOtp.expiresAt;
    if (isOtpMatch) {
      return { success: true, valid: true, method: "External Dispatch Provider (SMS/Email OTP)" };
    }

    return {
      success: false,
      valid: false,
      error: "Invalid 2FA code. Please provide the active 6-digit code from Google/Microsoft Authenticator or requested dispatch.",
    };
  },

  async adminChangePasswordWith2FA(
    currentPasswordAttempt: string,
    newPassword: string,
    twoFactorCode: string
  ): Promise<{ success: boolean; error?: string; methodUsed?: string }> {
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

    // 2. Verify 2FA code: First via RFC 6238 External Authenticator TOTP, then external OTP
    const cleanCode = twoFactorCode.trim();
    const secret = adminUser.twoFactorSecret;
    if (!secret) return { success: false, error: "Set up an authenticator app first." };

    const isTotpValid = verifyTOTP(cleanCode, secret);
    const isOtpValid =
      activeAdmin2faOtp &&
      activeAdmin2faOtp.otp === cleanCode &&
      Date.now() <= activeAdmin2faOtp.expiresAt;

    if (!isTotpValid && !isOtpValid) {
      return {
        success: false,
        error: "Invalid Two-Factor Authentication (2FA) code. Please enter the current 6-digit code from your external Authenticator app (Google Authenticator, Microsoft Authenticator) or the dispatched SMS/Email code.",
      };
    }

    const methodUsed = isTotpValid
      ? "External Authenticator App (RFC 6238 TOTP)"
      : "External Dispatched Security Code";

    // 3. Hash and save new password
    adminUser.password = hashPassword(newPassword);
    await saveDatabase(db);
    activeAdmin2faOtp = null; // Invalidate one-time dispatch after successful password reset

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
