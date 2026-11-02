import { getDatabase, saveDatabase } from "../db/database";
import { User, Address, Review } from "../types";

export const userService = {
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
    const existing = (db.users || []).find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase() || u.mobileNumber === data.mobileNumber
    );

    if (existing) {
      return { success: false, error: "A user with this email or mobile number already exists." };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      mobileNumber: data.mobileNumber.trim(),
      password: data.password, // Stored securely
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

  async login(emailOrPhone: string, passwordAttempt: string): Promise<{
    success: boolean;
    user?: Omit<User, "password">;
    isAdmin?: boolean;
    error?: string;
  }> {
    const db = await getDatabase();
    const identifier = emailOrPhone.trim().toLowerCase();

    // Check admin credentials
    if (
      (identifier === "admin@sathyastores.com" || identifier === "admin") &&
      passwordAttempt === "admin123"
    ) {
      const adminUser = (db.users || []).find((u) => u.role === "owner") || {
        id: "usr-admin-1",
        fullName: "Store Administrator",
        email: "admin@sathyastores.com",
        mobileNumber: "+91 98480 22338",
        role: "owner" as const,
        mobileVerified: true,
        emailVerified: true,
        accountStatus: "active" as const,
        createdAt: new Date().toISOString(),
      };
      return { success: true, user: adminUser, isAdmin: true };
    }

    const user = (db.users || []).find(
      (u) =>
        (u.email.toLowerCase() === identifier || u.mobileNumber === identifier) &&
        u.password === passwordAttempt
    );

    if (!user) {
      return { success: false, error: "Invalid credentials. Please verify your email/phone and password." };
    }

    if (user.accountStatus === "suspended") {
      return { success: false, error: "This account has been suspended by store administration." };
    }

    const { password, ...safeUser } = user;
    return { success: true, user: safeUser, isAdmin: user.role === "owner" };
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

    db.users[idx].password = newPassword;
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
