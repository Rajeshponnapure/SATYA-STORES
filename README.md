# Satya Stores

Satya Stores is a mobile-first e-commerce website for electronics and home appliances, built for Vasavi Enterprises. The project includes a customer storefront, account and order flows, and a store-owner administration dashboard.

## Project snapshot

| 16 app routes | 5 mobile nav destinations | 2 payment paths | 2 storage modes |
| --- | --- | --- | --- |
| Store, account, checkout, orders, admin, and more | Home, catalog, cart, wishlist, account | UPI/bank transfer and optional Razorpay | Local JSON or Supabase PostgreSQL |

These counts describe the code in this repository; they are not live store or sales metrics.

## System overview

![Satya Stores architecture: Next.js frontend, Express API, persistence and payment providers](docs/images/architecture.svg)

## Shopping flow

![Customer shopping flow from discovery through payment verification and delivery tracking](docs/images/shopping-flow.svg)

## What the project includes

### Customer experience

- Browse and search products, explore categories, inspect product details, and select variants.
- Maintain a cart and wishlist.
- Create an account, manage contact details and delivery addresses, and add a profile photo.
- Place orders, submit UPI or bank-transfer evidence, and follow order status.
- View order history and individual order details.
- Use the responsive storefront and thumb-friendly mobile navigation.

### Store-owner dashboard

- Review orders and payment evidence; approve or reject payments.
- Manage delivery states, refunds, and payment settlements.
- Manage products, categories, inventory, promotions, and homepage content.
- Manage customer accounts, store settings, and the owner profile.
- Configure two-factor authentication.

### Payments

- **UPI or bank transfer:** customers submit payment details; the store owner verifies payment in the dashboard.
- **Razorpay:** optional checkout and webhook support when provider credentials are configured.

## Customer-facing routes

| Route | Page |
| --- | --- |
| / | Storefront home |
| /search | Product search |
| /category/[slug] | Category listing |
| /product/[slug] | Product details |
| /cart | Shopping cart |
| /checkout | Delivery and payment checkout |
| /favorites | Wishlist |
| /account | Customer profile and account overview |
| /orders | Order history |
| /orders/[id] | Order details and tracking |
| /auth/login | Customer sign-in |
| /auth/signup | Customer registration |
| /auth/forgot-password | Password reset |
| /pages/[slug] | Store information pages |
| /admin | Store-owner access and dashboard |

## Technology and architecture

| Area | Technology |
| --- | --- |
| Frontend | Next.js 15 App Router, React 19, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Cloud database | Supabase PostgreSQL |
| Local database | JSON file at backend/data/database.json |
| UI libraries | lucide-react, Framer Motion, Sonner |
| Payments | UPI/bank transfer flow and optional Razorpay integration |

The browser loads the Next.js app on port 3000. Next.js rewrites API and uploaded-media requests to the Express backend on port 5000. Backend services contain the business rules for accounts, catalog, orders, payments, inventory, delivery, and content.

## Repository structure

~~~text
.
├── README.md
├── docs/
│   └── images/                 # README architecture and flow illustrations
├── frontend/
│   ├── app/                    # Next.js pages and route segments
│   ├── components/
│   │   ├── admin/              # Admin dashboard upload tools
│   │   ├── layout/             # Header, footer, mobile navigation
│   │   ├── profile/            # Shared profile-photo picker
│   │   └── storefront/         # Hero, categories, product cards
│   ├── context/StoreContext.tsx
│   ├── lib/                    # Shared helpers and frontend seed data
│   └── next.config.mjs
└── backend/
    ├── db/                     # Local/Supabase database adapter and seed data
    ├── migrations/             # Incremental SQL migrations
    ├── services/               # Business logic
    ├── utils/                  # Password and admin-session utilities
    ├── schema.sql              # Supabase schema and seed statements
    ├── server.ts               # Express API and middleware
    └── types/
~~~

## Requirements

- Node.js 20 or newer and npm.
- Optional Supabase project for cloud persistence.
- Optional Razorpay account and credentials for Razorpay checkout.

## Install

Install dependencies for both applications:

~~~powershell
cd frontend
npm install

cd ..\backend
npm install
~~~

## Run in development

Start the backend and frontend in separate terminals from the repository root.

**Terminal 1 — backend**

~~~powershell
cd backend
npm run dev
~~~

The API listens on http://localhost:5000 by default. Its health endpoint is /api/health.

**Terminal 2 — frontend**

~~~powershell
cd frontend
npm run dev
~~~

Open http://localhost:3000. The frontend proxies /api and /uploads requests to the backend.

Development output is written to frontend/.next-dev; production builds use frontend/.next. Keeping these output folders separate prevents a build from replacing chunks served by the development server.

## Environment configuration

Create local environment files and keep them out of source control.

### frontend/.env.local

~~~dotenv
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=
~~~

The backend URL defaults to port 5000 in local development. Set it when the API is hosted elsewhere. The Razorpay key ID is only needed for Razorpay checkout.

### backend/.env

~~~dotenv
PORT=5000
FRONTEND_URL=http://localhost:3000
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret

# Optional Supabase cloud database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Optional Razorpay payment provider
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
~~~

Keep the admin-session secret and Razorpay secret on the backend. Configure database credentials and Supabase row-level security for the intended deployment.

## Database setup

### Local mode

Without Supabase credentials, the backend persists data to backend/data/database.json and creates the file when needed. Do not commit a database file that contains real customer or order data.

### Supabase mode

1. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in backend/.env.
2. For a new project, run backend/schema.sql in the Supabase SQL editor.
3. For an existing project, apply the SQL files in backend/migrations. Profile-photo persistence requires backend/migrations/20261107_profile_images.sql.
4. Restart the backend and confirm its database status endpoint while signed in as the store owner.

The database adapter maps database fields to application types and maintains a local JSON cache. Failed Supabase writes are surfaced as errors instead of being reported as successful local-only profile updates.

Before production use, review the access policies in backend/schema.sql. The checked-in schema includes permissive policies intended for the demo setup; replace them with policies suited to your authentication and data-access model before storing real customer or payment data.

## API overview

API routes are defined in backend/server.ts and use the /api prefix.

- **Authentication:** signup, login, forgot password, and reset password.
- **Customer accounts:** customer profile, favorites, and order history.
- **Catalog:** products, categories, promotions, and product reviews.
- **Orders:** creation, details, cancellation, payment evidence, and Razorpay order/verification.
- **Store operations:** admin profiles, users, orders, payments, refunds, inventory, delivery, coupons, layout, and settings.
- **Infrastructure:** health check, database status, and image upload.

Admin API requests use an expiring HttpOnly session cookie. See backend/utils/adminSession.ts and the owner-only middleware in backend/server.ts for the access-control implementation.

## Common commands

| Application | Command | Description |
| --- | --- | --- |
| Frontend | npm run dev | Run Next.js on port 3000 |
| Frontend | npm run lint | Run ESLint |
| Frontend | npm run build | Create and type-check the production build |
| Frontend | npm start | Serve the production build |
| Backend | npm run dev | Run Express with file watching |
| Backend | npm run build | Compile and type-check backend TypeScript |
| Backend | npm start | Start the backend server |

## Notes and troubleshooting

- If the frontend cannot reach the API, confirm the backend is running and NEXT_PUBLIC_BACKEND_URL points to it.
- If development chunks return 404 or the icon route fails, stop duplicate Next.js processes and restart npm run dev so Next.js can rebuild .next-dev.
- If profile photo writes fail in Supabase, apply the profile-image migration and inspect the backend error output.
- If Razorpay is unavailable, check the frontend public key and backend key ID/secret, then restart both apps.
- Product seed data contains remote image URLs, so product photography requires network access.
- Payment completion, email/SMS delivery, shipping integrations, and production security depend on provider and deployment configuration.

## Further reading

- Frontend notes: frontend/README.md
- Backend notes: backend/README.md
- Supabase schema: backend/schema.sql
- Incremental migrations: backend/migrations/
