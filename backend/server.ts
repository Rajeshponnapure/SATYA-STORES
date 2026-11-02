/**
 * Satya Stores — Standalone Backend Entry Point
 * Can be imported into Next.js Route Handlers or run with Node/ts-node.
 */
import { orderService } from "./services/orderService";
import { paymentService } from "./services/paymentService";
import { inventoryService } from "./services/inventoryService";
import { productService } from "./services/productService";
import { deliveryService } from "./services/deliveryService";
import { getDatabase, saveDatabase } from "./db/database";
import { isSupabaseConfigured, supabase } from "./db/supabase";

export {
  orderService,
  paymentService,
  inventoryService,
  productService,
  deliveryService,
  getDatabase,
  saveDatabase,
  isSupabaseConfigured,
  supabase,
};

export default {
  orders: orderService,
  payments: paymentService,
  inventory: inventoryService,
  products: productService,
  deliveries: deliveryService,
};
