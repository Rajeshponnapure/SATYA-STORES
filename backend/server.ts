import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { productService } from "./services/productService";
import { orderService } from "./services/orderService";
import { paymentService } from "./services/paymentService";
import { inventoryService } from "./services/inventoryService";
import { deliveryService } from "./services/deliveryService";
import { getDatabase, saveDatabase } from "./db/database";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend running on Port 3000
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

app.use(express.json());

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Satya Stores Backend API",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Products API
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

// Orders API
app.get("/api/orders", async (_req: Request, res: Response) => {
  try {
    const orders = await orderService.getAllOrders();
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

// Customer UTR Payment Submission
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

// Owner Administration Endpoints
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

// Settings API
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
