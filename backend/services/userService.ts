import { getDatabase, saveDatabase, initialAdminProfile } from "../db/database";
import { User, Address, Review, AdminProfile } from "../types";
import { hashPassword, verifyPassword, generateOtp } from "../utils/auth";

interface PasswordResetToken {
  identifier: string;
  otp: string;
  expiresAt: number;
}

const passwordResetTokens = new Map<string, PasswordResetToken>();
let activeAdmin2faOtp: { otp: string; expiresAt: number } | null = null;

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
    const safeUsers = users.map(({ password, ...rest }) => rest);
    return { users: safeUsers, total: users.length };
  },

  async getUserById(id: string): Promise<Omit<User, "password"> | null> {
    const db = await getDatabase();
    const user = (db.users || []).find((u) => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async registerUser(data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
  }): Promise<{ success: boolean; user?: Omit<User, "password">; error?: string }> {
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

    const { password, ...safeUser } = newUser;
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

    const { password, ...safeUser } = user;
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
    const db = await getDatabase();
    const idx = (db.users || []).findIndex((u) => u.id === userId);
    if (idx === -1) {
      return { success: false, error: "User not found." };
    }

    // Save with salt:hash
    db.users[idx].password = hashPassword(newPassword);
    await saveDatabase(db);
    return { success: true };
  },

  async updateUserProfile(
    userId: string,
    updates: Partial<Pick<User, "fullName" | "mobileNumber" | "addresses">>
  ): Promise<{ success: boolean; user?: Omit<User, "password">; error?: string }> {
    const db = await getDatabase();
    const idx = (db.users || []).findIndex((u) => u.id === userId);
    if (idx === -1) {
      return { success: false, error: "User not found." };
    }

    db.users[idx] = { ...db.users[idx], ...updates };
    await saveDatabase(db);
    const { password, ...safeUser } = db.users[idx];
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
      twoFactorPin: db.adminProfile.twoFactorPin ? "******" : undefined,
    };
  },

  async updateAdminProfile(updates: Partial<AdminProfile>): Promise<{ success: boolean; profile: AdminProfile }> {
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
    return { success: true, profile: db.adminProfile };
  },

  async generateAdmin2fa(): Promise<{ success: boolean; otp: string; message: string }> {
    const otp = generateOtp();
    activeAdmin2faOtp = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    return {
      success: true,
      otp,
      message: `2FA Security Code generated: ${otp}. Valid for 10 minutes.`,
    };
  },

  async adminChangePasswordWith2FA(
    currentPasswordAttempt: string,
    newPassword: string,
    twoFactorCode: string
  ): Promise<{ success: boolean; error?: string }> {
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

    // 2. Verify a short-lived OTP. Static fallback PINs are not secure.
    const cleanCode = twoFactorCode.trim();

    const isOtpValid = activeAdmin2faOtp &&
      activeAdmin2faOtp.otp === cleanCode &&
      Date.now() <= activeAdmin2faOtp.expiresAt;

    if (!isOtpValid) {
      return {
        success: false,
        error: "Invalid or expired Two-Factor Authentication (2FA) code.",
      };
    }

    // 3. Hash and save new password
    adminUser.password = hashPassword(newPassword);
    await saveDatabase(db);
    activeAdmin2faOtp = null; // Invalidate OTP after use

    return { success: true };
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
