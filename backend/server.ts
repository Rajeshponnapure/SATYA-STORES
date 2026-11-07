import express, { Request, Response } from "express";
import crypto from "crypto";
import cors from "cors";
import fs from "fs";
import path from "path";
import { productService } from "./services/productService";
import { orderService } from "./services/orderService";
import { paymentService } from "./services/paymentService";
import { razorpayService } from "./services/razorpayService";
import { inventoryService } from "./services/inventoryService";
import { deliveryService } from "./services/deliveryService";
import { userService } from "./services/userService";
import { cmsService } from "./services/cmsService";
import { getDatabase, saveDatabase } from "./db/database";
import { initialPromotions } from "./db/initialData";
import { isSupabaseConfigured } from "./db/supabase";
// Optional Vercel Blob storage for production media uploads
let putBlob: any = null;
try {
  const vb = require("@vercel/blob");
  putBlob = vb.put || vb.default?.put;
} catch (e) {}
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import {
  clearAdminSession,
  clearCustomerSession,
  getCustomerSessionId,
  hasAdminSession,
  requireAdminSession,
  requireCustomerSession,
  setAdminSession,
  setCustomerSession,
} from "./utils/session";

const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(rateLimit({ windowMs: 10 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));

const uploadsDir = path.resolve(__dirname, "data", "uploads");
if (!process.env.VERCEL && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!process.env.VERCEL) app.use("/uploads", express.static(uploadsDir));

// Enable CORS for frontend clients (local, preview, production)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({
  limit: "4.3mb",
  verify: (req, _res, buffer) => {
    if ((req as Request).originalUrl.split("?")[0] === "/api/payments/razorpay/webhook") {
      (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    }
  },
}));
app.use(express.urlencoded({ limit: "100kb", extended: true, parameterLimit: 100 }));

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false });
app.use(["/api/auth/login", "/api/admin/login", "/api/auth/signup", "/api/auth/forgot-password", "/api/auth/reset-password"], authRateLimit);

app.use("/api", (req: Request, res: Response, next: import("express").NextFunction) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) || req.path === "/payments/razorpay/webhook") return next();
  const origin = req.get("origin");
  if (!origin) return next();
  try {
    if (new URL(origin).host === req.get("host")) return next();
    if (origin.endsWith(".vercel.app") || origin.includes("localhost") || origin.includes("127.0.0.1")) return next();
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return next();
  } catch {}
  return res.status(403).json({ success: false, error: "Cross-origin request rejected." });
});

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Satya Stores Backend API",
    dbMode: isSupabaseConfigured ? "supabase" : "local-file",
  });
});

// ==========================================
// AUTH & USER APIs
// ==========================================
app.post("/api/auth/signup", async (req: Request, res: Response) => {
  try {
    const { fullName, email, mobileNumber, password } = req.body || {};
    if (typeof fullName !== "string" || fullName.trim().length < 2 || fullName.length > 100 ||
      typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof mobileNumber !== "string" || mobileNumber.trim().length < 7 || mobileNumber.length > 24 ||
      typeof password !== "string" || password.length < 12 || password.length > 200) {
      return res.status(400).json({ success: false, error: "Provide valid account details and a password of at least 12 characters." });
    }
    const result = await userService.registerUser(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    if (!result.user || !setCustomerSession(res, result.user.id)) {
      return res.status(503).json({ success: false, error: "Secure session configuration is unavailable." });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body || {};
    if (typeof emailOrPhone !== "string" || emailOrPhone.length > 254 || typeof password !== "string" || password.length > 200) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }
    const result = await userService.login(emailOrPhone, password);
    if (!result.success || result.isAdmin || !result.user || !setCustomerSession(res, result.user.id)) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/login", async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body || {};
    if (typeof emailOrPhone !== "string" || emailOrPhone.length > 254 || typeof password !== "string" || password.length > 200) {
      return res.status(401).json({ success: false, error: "Invalid administrative credentials." });
    }
    const result = await userService.login(emailOrPhone, password);
    if (!result.success || !result.isAdmin) {
      return res.status(403).json({ success: false, error: "Invalid administrative credentials." });
    }
    if (!setAdminSession(res)) {
      return res.status(503).json({ success: false, error: "Admin session signing is not configured." });
    }
    res.json({ success: true, user: result.user, isAdmin: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// Owner-only API routes require an expiring, HttpOnly signed session cookie.
app.use("/api/admin", requireAdminSession);
app.post("/api/admin/logout", (_req: Request, res: Response) => {
  clearAdminSession(res);
  res.json({ success: true });
});
app.post("/api/auth/logout", (_req: Request, res: Response) => {
  clearCustomerSession(res);
  res.json({ success: true });
});

// Catalog mutations and media uploads are also owner-only.
const requireAdminForMutation = (req: Request, res: Response, next: import("express").NextFunction) => {
  if (req.method === "GET" || req.method === "HEAD") return next();
  return requireAdminSession(req, res, next);
};
app.use("/api/products", requireAdminForMutation);
app.use("/api/categories", requireAdminForMutation);
app.use("/api/upload", (req: Request, res: Response, next: import("express").NextFunction) => {
  if (req.method === "GET" || req.method === "HEAD") return next();
  if (hasAdminSession(req)) return next();
  return requireCustomerSession(req, res, next);
});
app.use("/api/upload", rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false }));
app.use("/api/settings", requireAdminForMutation);

// Forgot Password Request (Generates OTP)
app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({ success: false, error: "Password recovery is unavailable until an email or SMS delivery provider is configured." });
    }
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json({ success: false, error: "Please enter your email or mobile number." });
    }
    const result = await userService.requestPasswordReset(emailOrPhone);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// Reset Password with OTP & New Hashed Password
app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({ success: false, error: "Password recovery is unavailable until an email or SMS delivery provider is configured." });
    }
    const { emailOrPhone, otp, newPassword } = req.body;
    if (!emailOrPhone || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: "Please fill in all required fields." });
    }
    const result = await userService.resetPassword(emailOrPhone, otp, newPassword);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// Admin Profile Endpoints
app.get("/api/admin/profile", async (_req: Request, res: Response) => {
  try {
    const profile = await userService.getAdminProfile();
    res.json({ success: true, profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.put("/api/admin/profile", async (req: Request, res: Response) => {
  try {
    const { fullName, email, mobileNumber, businessEntity, profileImage } = req.body || {};
    if (fullName !== undefined && (typeof fullName !== "string" || fullName.trim().length < 2 || fullName.length > 100) ||
      email !== undefined && (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
      mobileNumber !== undefined && (typeof mobileNumber !== "string" || mobileNumber.length < 7 || mobileNumber.length > 24) ||
      businessEntity !== undefined && (typeof businessEntity !== "string" || businessEntity.length > 120)) {
      return res.status(400).json({ success: false, error: "Profile details are invalid." });
    }
    const result = await userService.updateAdminProfile({ fullName, email, mobileNumber, businessEntity, profileImage });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.get("/api/admin/2fa-setup", async (_req: Request, res: Response) => {
  try {
    const result = await userService.getAdmin2faSetup();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/verify-2fa", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: "Verification code is required." });
    }
    const result = await userService.verifyAdmin2faCode(code);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/generate-2fa", async (_req: Request, res: Response) => {
  try {
    const result = await userService.generateAdmin2fa();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/change-password", async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, twoFactorCode } = req.body;
    if (!currentPassword || !newPassword || !twoFactorCode) {
      return res.status(400).json({
        success: false,
        error: "Current password, new password, and 2FA verification code are required.",
      });
    }
    const result = await userService.adminChangePasswordWith2FA(
      currentPassword,
      newPassword,
      twoFactorCode
    );
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, message: "Admin password updated successfully with 2FA verification." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// Image Upload API (Accepts Base64 payload from desktop drag-drop or mobile file/camera picker)
app.post("/api/upload", async (req: Request, res: Response) => {
  try {
    const { fileName, fileData } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: "No image payload supplied." });
    }

    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ success: false, error: "Use a JPG, PNG, or WebP image." });
    const mime = matches[1].toLowerCase();
    const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
    const ext = extensions[mime];
    if (!ext) return res.status(400).json({ success: false, error: "Use a JPG, PNG, or WebP image." });
    const buffer = Buffer.from(matches[2], "base64");
    if (!buffer.length || buffer.length > 3 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: "Images must be 3 MB or smaller." });
    }
    const validSignature = mime === "image/jpeg"
      ? buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      : mime === "image/png"
        ? buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        : buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
    if (!validSignature) return res.status(400).json({ success: false, error: "The uploaded file content does not match its image type." });

    const cleanBase = (fileName || "product_img").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
    const uniqueName = `upload_${Date.now()}_${cleanBase}.${ext}`;
    let relativeUrl = `/uploads/${uniqueName}`;

    // Blob storage works on any host (Vercel, Render, ...) once the token is set.
    if (process.env.BLOB_READ_WRITE_TOKEN && putBlob) {
      try {
        const blob = await putBlob(`uploads/${uniqueName}`, buffer, { access: "public", contentType: mime });
        relativeUrl = blob.url;
      } catch (blobErr) {
        console.warn("[Upload] Vercel blob put warning, using inline data URI:", blobErr);
        relativeUrl = `data:${mime};base64,${buffer.toString("base64")}`;
      }
    } else if (process.env.RENDER) {
      // Inline base64 URI guarantees image persistence through Render deploys
      // (ephemeral disk) when no Blob token is configured.
      relativeUrl = `data:${mime};base64,${buffer.toString("base64")}`;
    } else {
      fs.writeFileSync(path.join(uploadsDir, uniqueName), buffer);
    }

    res.json({
      success: true,
      url: relativeUrl,
      fileName: uniqueName,
      message: "Image uploaded successfully.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// Database & Supabase Status
app.get("/api/admin/database-status", async (_req: Request, res: Response) => {
  try {
    const isConfigured = Boolean(process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
    res.json({
      success: true,
      isConfigured,
      engine: isConfigured ? "Supabase PostgreSQL (backend-only credentials)" : "Local development storage",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.get("/api/users/:id", requireCustomerSession, async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(String(req.params.id));
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.put("/api/users/:id/profile", requireCustomerSession, async (req: Request, res: Response) => {
  try {
    const { fullName, mobileNumber, profileImage, addresses } = req.body || {};
    if (fullName !== undefined && (typeof fullName !== "string" || fullName.trim().length < 2 || fullName.length > 100) ||
      mobileNumber !== undefined && (typeof mobileNumber !== "string" || mobileNumber.length < 7 || mobileNumber.length > 24) ||
      addresses !== undefined && (!Array.isArray(addresses) || addresses.length > 20 || addresses.some((address: any) =>
        !address || typeof address.recipientName !== "string" || address.recipientName.trim().length < 2 || address.recipientName.length > 100 ||
        typeof address.mobileNumber !== "string" || address.mobileNumber.length < 7 || address.mobileNumber.length > 24 ||
        typeof address.addressLine1 !== "string" || address.addressLine1.trim().length < 3 || address.addressLine1.length > 200 ||
        typeof address.city !== "string" || address.city.trim().length < 2 || address.city.length > 100 ||
        typeof address.state !== "string" || address.state.trim().length < 2 || address.state.length > 100 ||
        typeof address.postalCode !== "string" || address.postalCode.length < 4 || address.postalCode.length > 12))) {
      return res.status(400).json({ success: false, error: "Profile details are invalid." });
    }
    const safeAddresses = addresses?.map((address: any) => ({
      id: typeof address.id === "string" && address.id.length <= 100 ? address.id : crypto.randomUUID(),
      userId: String(req.params.id),
      recipientName: address.recipientName.trim(),
      mobileNumber: address.mobileNumber.trim(),
      addressLine1: address.addressLine1.trim(),
      addressLine2: typeof address.addressLine2 === "string" ? address.addressLine2.trim().slice(0, 200) : "",
      city: address.city.trim(),
      state: address.state.trim(),
      postalCode: address.postalCode.trim(),
      isDefault: address.isDefault === true,
    }));
    const result = await userService.updateUserProfile(String(req.params.id), { fullName, mobileNumber, profileImage, addresses: safeAddresses });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/users/:id/favorites", requireCustomerSession, async (req: Request, res: Response) => {
  try {
    const { productId } = req.body || {};
    if (typeof productId !== "string" || productId.length > 100) {
      return res.status(400).json({ success: false, error: "Product ID is invalid." });
    }
    const result = await userService.toggleFavorite(String(req.params.id), productId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// Admin User Management
app.get("/api/admin/users", async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const result = await userService.getAllUsers(search);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/users", async (req: Request, res: Response) => {
  try {
    const result = await userService.adminCreateUser(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.put("/api/admin/users/:id", async (req: Request, res: Response) => {
  try {
    const result = await userService.adminUpdateUser(String(req.params.id), req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
  try {
    const result = await userService.adminDeleteUser(String(req.params.id));
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.put("/api/admin/users/:id/password", async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 200) {
      return res.status(400).json({ success: false, error: "Password must be between 12 and 200 characters." });
    }
    const result = await userService.adminUpdateUserPassword(String(req.params.id), newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// ==========================================
// PRODUCTS & CATEGORIES APIs
// ==========================================
app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const allProducts = await productService.getAllProducts();
    const products = hasAdminSession(req) ? allProducts : allProducts.filter((product) => product.publicationStatus === "active");
    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/products", async (req: Request, res: Response) => {
  try {
    const result = await productService.addProduct(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.put("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const result = await productService.updateProduct(String(req.params.id), req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.delete("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const result = await productService.deleteProduct(String(req.params.id));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/products/:id/restore", async (req: Request, res: Response) => {
  try {
    const result = await productService.restoreProduct(String(req.params.id));
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.get("/api/categories", async (req: Request, res: Response) => {
  try {
    const allCategories = await productService.getAllCategories();
    const categories = hasAdminSession(req) ? allCategories : allCategories.filter((category) => category.status === "active");
    res.json({ success: true, categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.get("/api/promotions", async (_req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const promotions = db.promotions?.length ? db.promotions : initialPromotions;
    res.json({ success: true, promotions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/categories", async (req: Request, res: Response) => {
  try {
    const result = await productService.addCategory(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.put("/api/categories/:id", async (req: Request, res: Response) => {
  try {
    const result = await productService.updateCategory(String(req.params.id), req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.delete("/api/categories/:id", async (req: Request, res: Response) => {
  try {
    const result = await productService.deleteCategory(String(req.params.id));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// ==========================================
// ORDERS & LIFECYCLE APIs
// ==========================================
app.get("/api/orders", async (req: Request, res: Response) => {
  try {
    if (hasAdminSession(req)) {
      const orders = await orderService.getAllOrders();
      return res.json({ success: true, orders });
    }
    const customerId = getCustomerSessionId(req);
    if (customerId) {
      const orders = await orderService.getUserOrders(customerId);
      return res.json({ success: true, orders });
    }
    // Return empty list gracefully if visitor is not logged in
    res.json({ success: true, orders: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.get("/api/users/:id/orders", requireCustomerSession, async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getUserOrders(String(req.params.id));
    res.json({ success: true, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/orders", requireCustomerSession, async (req: Request, res: Response) => {
  try {
    const userId = getCustomerSessionId(req);
    const user = userId ? await userService.getUserById(userId) : null;
    if (!user) return res.status(401).json({ success: false, error: "Customer sign-in required." });
    const result = await orderService.createOrder({ ...req.body, userId, customerEmail: user.email });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

const requireOrderOwner = async (req: Request, res: Response, next: import("express").NextFunction) => {
  if (hasAdminSession(req)) return next();
  const userId = getCustomerSessionId(req);
  if (!userId) return res.status(401).json({ success: false, error: "Customer sign-in required." });
  try {
    const order = await orderService.getOrderById(String(req.params.id));
    if (!order || order.userId !== userId) return res.status(404).json({ success: false, error: "Order not found." });
    res.locals.order = order;
    return next();
  } catch {
    return res.status(500).json({ success: false, error: "Unable to load order." });
  }
};

app.get("/api/orders/:id", requireOrderOwner, async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.patch("/api/admin/orders/:id/status", async (req: Request, res: Response) => {
  try {
    const { orderStatus, deliveryStatus, deliveryNotes, manualDeliveryReference } = req.body;
    const result = await orderService.updateOrderStatus(
      String(req.params.id),
      orderStatus,
      deliveryStatus,
      deliveryNotes,
      manualDeliveryReference
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.put("/api/admin/orders/:id/items", async (req: Request, res: Response) => {
  try {
    const { items, discount } = req.body;
    const result = await orderService.modifyOrderItems(String(req.params.id), items, discount);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/orders/:id/cancel", requireOrderOwner, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const result = await orderService.cancelOrder(String(req.params.id), reason);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// ==========================================
// PAYMENTS & UTR APIs
// ==========================================
app.post("/api/orders/:id/payment", requireOrderOwner, async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const { utr, evidenceUrl } = req.body || {};
    if (typeof utr !== "string" || utr.trim().length < 6 || utr.length > 32 ||
      evidenceUrl !== undefined && (typeof evidenceUrl !== "string" || evidenceUrl.length > 2048)) {
      return res.status(400).json({ success: false, error: "Payment details are invalid." });
    }
    const result = await paymentService.submitPaymentProof(orderId, utr, evidenceUrl);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.get("/api/admin/payments", async (_req: Request, res: Response) => {
  try {
    const payments = await paymentService.getAllPayments();
    res.json({ success: true, payments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/payments/verify", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const result = await paymentService.verifyPayment(orderId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/payments/reject", async (req: Request, res: Response) => {
  try {
    const { orderId, reason } = req.body;
    const result = await paymentService.rejectPayment(orderId, reason);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// ==========================================
// RAZORPAY GATEWAY, REFUNDS & SETTLEMENTS APIs
// ==========================================
app.get("/api/payments/razorpay-config", (_req: Request, res: Response) => {
  res.json({
    success: true,
    keyId: razorpayService.getKeyId(),
    currency: "INR",
    merchantName: "Satya Stores | Vasavi Enterprises",
  });
});

app.post("/api/orders/:id/razorpay/create-order", requireOrderOwner, async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const result = await razorpayService.createOrder(order.id, order.totalAmount, "INR");
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Persist razorpay order id on the order
    if (result.razorpayOrder?.id) {
      order.razorpayOrderId = result.razorpayOrder.id;
      order.paymentMethod = "RAZORPAY";
      order.updatedAt = new Date().toISOString();
      await saveDatabase(db);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/orders/:id/razorpay/verify", requireOrderOwner, async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const result = await razorpayService.verifyPayment(
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/orders/:id/refund", async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const { amount, reason } = req.body;

    const result = await razorpayService.processRefund(orderId, amount, reason);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.get("/api/admin/settlements", async (_req: Request, res: Response) => {
  try {
    const settlements = await razorpayService.getSettlements();
    res.json({ success: true, settlements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/payments/razorpay/webhook", async (req: Request, res: Response) => {
  try {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const signature = req.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!rawBody || !webhookSecret) return res.status(503).json({ status: "error" });
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest();
    let received: Buffer;
    try { received = Buffer.from(signature, "hex"); } catch { received = Buffer.alloc(0); }
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      return res.status(401).json({ status: "error" });
    }
    const event = req.body?.event;
    const payload = req.body?.payload;

    if (event === "payment.captured" && payload?.payment?.entity) {
      const payment = payload.payment.entity;
      const orderId = payment.notes?.orderId;
      if (orderId) {
        const verified = await razorpayService.verifyPayment(
          orderId,
          payment.order_id,
          payment.id,
          "",
          true
        );
        if (!verified.success) return res.status(400).json({ status: "error" });
      }
    } else if (event === "refund.processed" && payload?.refund?.entity) {
      const refund = payload.refund.entity;
      const orderId = refund.notes?.orderId;
      if (orderId) {
        const db = await getDatabase();
        const order = db.orders.find((item) => item.id === orderId && item.razorpayPaymentId === refund.payment_id);
        if (order) {
          order.refundId = refund.id;
          order.refundAmount = refund.amount / 100;
          order.refundStatus = refund.status;
          order.paymentStatus = refund.status === "processed"
            ? (order.refundAmount >= order.totalAmount ? "Refunded" : "Partially Refunded")
            : order.paymentStatus;
          order.updatedAt = new Date().toISOString();
          await saveDatabase(db);
        }
      }
    }

    res.json({ status: "ok" });
  } catch {
    res.status(500).json({ status: "error" });
  }
});

// ==========================================
// INVENTORY & DELIVERY APIs
// ==========================================
app.get("/api/admin/inventory/movements", async (_req: Request, res: Response) => {
  try {
    const movements = await inventoryService.getMovements();
    res.json({ success: true, movements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/inventory/adjust", async (req: Request, res: Response) => {
  try {
    const result = await inventoryService.adjustStock(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.patch("/api/admin/deliveries", async (req: Request, res: Response) => {
  try {
    const result = await deliveryService.updateDelivery(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// ==========================================
// COUPONS & DISCOUNTS
// ==========================================
app.get("/api/admin/coupons", async (_req: Request, res: Response) => {
  try {
    const coupons = await cmsService.getAllCoupons();
    res.json({ success: true, coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/coupons", async (req: Request, res: Response) => {
  try {
    const result = await cmsService.addCoupon(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.delete("/api/admin/coupons/:id", async (req: Request, res: Response) => {
  try {
    const result = await cmsService.deleteCoupon(String(req.params.id));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/coupons/apply", async (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;
    const result = await cmsService.applyCoupon(code, Number(subtotal));
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// ==========================================
// MARQUEES & ANNOUNCEMENTS
// ==========================================
app.get("/api/marquees", async (_req: Request, res: Response) => {
  try {
    const marquees = (await cmsService.getAllMarquees()).filter((item) => item.status === "active");
    res.json({ success: true, marquees });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/marquees", async (req: Request, res: Response) => {
  try {
    const result = await cmsService.addMarquee(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.delete("/api/admin/marquees/:id", async (req: Request, res: Response) => {
  try {
    const result = await cmsService.deleteMarquee(String(req.params.id));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// ==========================================
// REVIEWS
// ==========================================
app.get("/api/products/:id/reviews", async (req: Request, res: Response) => {
  try {
    const reviews = await userService.getProductReviews(String(req.params.id));
    res.json({ success: true, reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/reviews", requireCustomerSession, async (req: Request, res: Response) => {
  try {
    const userId = getCustomerSessionId(req)!;
    const user = await userService.getUserById(userId);
    if (!user) return res.status(401).json({ success: false, error: "Customer sign-in required." });
    const { productId, rating, title, comment } = req.body || {};
    if (typeof productId !== "string" || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
      typeof title !== "string" || title.trim().length > 120 || typeof comment !== "string" || comment.trim().length > 2000) {
      return res.status(400).json({ success: false, error: "Review details are invalid." });
    }
    const purchaseHistory = await orderService.getUserOrders(userId);
    if (!purchaseHistory.some((order) => order.paymentStatus === "Verified" && order.itemsSnapshot.some((item) => item.productId === productId))) {
      return res.status(403).json({ success: false, error: "Only verified customers may review purchased products." });
    }
    const result = await userService.addReview({ productId, userId, userName: user.fullName, rating, title: title.trim(), comment: comment.trim() });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// ==========================================
// HOMEPAGE LAYOUT & PREVIEW
// ==========================================
app.get("/api/layout", async (_req: Request, res: Response) => {
  try {
    const sections = await cmsService.getHomepageSections();
    res.json({ success: true, sections });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/admin/layout", async (req: Request, res: Response) => {
  try {
    const { sections } = req.body;
    const result = await cmsService.updateHomepageSections(sections);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

// ==========================================
// SETTINGS API
// ==========================================
app.get("/api/settings", async (_req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    res.json({ success: true, settings: db.settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.post("/api/settings", async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    db.settings = { ...db.settings, ...req.body };
    await saveDatabase(db);
    res.json({ success: true, settings: db.settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Request failed." });
  }
});

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "API route not found." });
});

app.use((error: any, _req: Request, res: Response, _next: import("express").NextFunction) => {
  const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
  res.status(status).json({ success: false, error: status === 413 ? "Request payload is too large." : "Request could not be processed." });
});

// Vercel adapts the exported Express application to its function runtime. A
// standalone listener is only needed for local development and non-Vercel hosts.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Satya Stores Backend] Server running on port ${PORT}`);
    console.log(`[Satya Stores Backend] REST API endpoint: http://localhost:${PORT}/api`);
  });
}

export default app;
