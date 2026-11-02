import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { productService } from "./services/productService";
import { orderService } from "./services/orderService";
import { paymentService } from "./services/paymentService";
import { inventoryService } from "./services/inventoryService";
import { deliveryService } from "./services/deliveryService";
import { userService } from "./services/userService";
import { cmsService } from "./services/cmsService";
import { getDatabase, saveDatabase } from "./db/database";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadsDir = path.resolve(__dirname, "data", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded assets statically
app.use("/uploads", express.static(uploadsDir));

// Enable CORS for frontend running on Port 3000
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"]
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Satya Stores Backend API",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// AUTH & USER APIs
// ==========================================
app.post("/api/auth/signup", async (req: Request, res: Response) => {
  try {
    const result = await userService.registerUser(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body;
    const result = await userService.login(emailOrPhone, password);
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/login", async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body;
    const result = await userService.login(emailOrPhone, password);
    if (!result.success || !result.isAdmin) {
      return res.status(403).json({ success: false, error: "Invalid administrative credentials." });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Forgot Password Request (Generates OTP)
app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  try {
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset Password with OTP & New Hashed Password
app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
  try {
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Profile Endpoints
app.get("/api/admin/profile", async (_req: Request, res: Response) => {
  try {
    const profile = await userService.getAdminProfile();
    res.json({ success: true, profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/admin/profile", async (req: Request, res: Response) => {
  try {
    const result = await userService.updateAdminProfile(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/generate-2fa", async (_req: Request, res: Response) => {
  try {
    const result = await userService.generateAdmin2fa();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// Image Upload API (Accepts Base64 payload from desktop drag-drop or mobile file/camera picker)
app.post("/api/upload", (req: Request, res: Response) => {
  try {
    const { fileName, fileData } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: "No image payload supplied." });
    }

    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = "png";

    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
      else if (mime.includes("png")) ext = "png";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("gif")) ext = "gif";
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(fileData, "base64");
    }

    const cleanBase = (fileName || "product_img").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
    const uniqueName = `upload_${Date.now()}_${cleanBase}.${ext}`;
    const destinationPath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(destinationPath, buffer);

    const relativeUrl = `/uploads/${uniqueName}`;
    res.json({
      success: true,
      url: relativeUrl,
      fileName: uniqueName,
      message: "Image uploaded successfully to server.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Database & Supabase Status
app.get("/api/admin/database-status", async (_req: Request, res: Response) => {
  try {
    const isConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project")
    );
    res.json({
      success: true,
      isConfigured,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "None",
      engine: isConfigured ? "Supabase Live PostgreSQL + Local Synchronized Cache" : "Zero-Budget Local Storage",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(String(req.params.id));
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/users/:id/profile", async (req: Request, res: Response) => {
  try {
    const result = await userService.updateUserProfile(String(req.params.id), req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/users/:id/favorites", async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const result = await userService.toggleFavorite(String(req.params.id), productId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin User Management
app.get("/api/admin/users", async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const result = await userService.getAllUsers(search);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/admin/users/:id/password", async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters." });
    }
    const result = await userService.adminUpdateUserPassword(String(req.params.id), newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// PRODUCTS & CATEGORIES APIs
// ==========================================
app.get("/api/products", async (_req: Request, res: Response) => {
  try {
    const products = await productService.getAllProducts();
    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/products", async (req: Request, res: Response) => {
  try {
    const result = await productService.addProduct(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const result = await productService.updateProduct(String(req.params.id), req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const result = await productService.deleteProduct(String(req.params.id));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await productService.getAllCategories();
    res.json({ success: true, categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/categories", async (req: Request, res: Response) => {
  try {
    const result = await productService.addCategory(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/categories/:id", async (req: Request, res: Response) => {
  try {
    const result = await productService.updateCategory(String(req.params.id), req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/categories/:id", async (req: Request, res: Response) => {
  try {
    const result = await productService.deleteCategory(String(req.params.id));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ORDERS & LIFECYCLE APIs
// ==========================================
app.get("/api/orders", async (_req: Request, res: Response) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json({ success: true, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/users/:id/orders", async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getUserOrders(String(req.params.id));
    res.json({ success: true, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/orders", async (req: Request, res: Response) => {
  try {
    const result = await orderService.createOrder(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/orders/:id", async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/admin/orders/:id/items", async (req: Request, res: Response) => {
  try {
    const { items, discount } = req.body;
    const result = await orderService.modifyOrderItems(String(req.params.id), items, discount);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/orders/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const result = await orderService.cancelOrder(String(req.params.id), reason);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// PAYMENTS & UTR APIs
// ==========================================
app.post("/api/orders/:id/payment", async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const { utr, evidenceUrl } = req.body;
    const result = await paymentService.submitPaymentProof(orderId, utr, evidenceUrl);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/admin/payments", async (_req: Request, res: Response) => {
  try {
    const payments = await paymentService.getAllPayments();
    res.json({ success: true, payments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/coupons", async (req: Request, res: Response) => {
  try {
    const result = await cmsService.addCoupon(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/admin/coupons/:id", async (req: Request, res: Response) => {
  try {
    const result = await cmsService.deleteCoupon(String(req.params.id));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// MARQUEES & ANNOUNCEMENTS
// ==========================================
app.get("/api/marquees", async (_req: Request, res: Response) => {
  try {
    const marquees = await cmsService.getAllMarquees();
    res.json({ success: true, marquees });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/marquees", async (req: Request, res: Response) => {
  try {
    const result = await cmsService.addMarquee(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/admin/marquees/:id", async (req: Request, res: Response) => {
  try {
    const result = await cmsService.deleteMarquee(String(req.params.id));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/reviews", async (req: Request, res: Response) => {
  try {
    const result = await userService.addReview(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/layout", async (req: Request, res: Response) => {
  try {
    const { sections } = req.body;
    const result = await cmsService.updateHomepageSections(sections);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/settings", async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    db.settings = { ...db.settings, ...req.body };
    await saveDatabase(db);
    res.json({ success: true, settings: db.settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Satya Stores Backend] Server running on port ${PORT}`);
  console.log(`[Satya Stores Backend] REST API endpoint: http://localhost:${PORT}/api`);
});

export default app;
