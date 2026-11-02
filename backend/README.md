# 🛠️ Satya Stores — Backend Architecture

This directory houses all server-side logic, database integrations, and transactional business services for Satya Stores.

---

## Folder Structure

```
src/backend/
├── db/
│   ├── database.ts      # 100% Free Persistent Local JSON Database Adapter
│   └── supabase.ts      # 100% Free Supabase PostgreSQL Cloud Integration
│
├── services/
│   ├── orderService.ts      # Atomic stock reservation & immutable order generation
│   ├── paymentService.ts    # Manual UPI/Bank UTR submission & verification logic
│   ├── inventoryService.ts  # Real-time stock counts & audit movement logging
│   ├── productService.ts    # Electronics catalog & SKU operations
│   └── deliveryService.ts   # Fulfillment milestones & manual courier tracking
│
└── index.ts             # Unified barrel export
```

---

## 📡 REST API Route Handlers

Located under `src/app/api/`:
- `POST /api/orders` — Atomically reserves stock and creates order
- `GET /api/orders` — Returns all orders from database
- `GET /api/orders/[id]` — Returns single order with milestone tracking
- `POST /api/orders/[id]/payment` — Submits customer UTR and receipt proof
- `POST /api/admin/payments/verify` — Store owner verifies credit, finalizes stock deduction
- `POST /api/admin/payments/reject` — Store owner rejects payment with mandatory reason
- `POST /api/admin/inventory/adjust` — Manual stock counter adjustment with audit trail
- `PATCH /api/admin/deliveries` — Updates fulfillment status and courier consignment
- `GET, POST /api/products` — Catalog retrieval and product publishing
- `GET, POST /api/settings` — Updates official store UPI ID and Bank account details

---

## 💾 Zero-Budget Database Setup
1. **Local Mode (Default)**: Automatically runs against `data/database.json`. Zero accounts, zero credit card, 100% free forever.
2. **Supabase Cloud Mode**: Put your free Project URL and Anon Key in `.env.local` and run `supabase-schema.sql` in the Supabase SQL editor.

