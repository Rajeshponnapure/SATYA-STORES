# Backend

The root [project README](../README.md) is the source of truth for architecture, API overview, setup, environment variables, database configuration, and commands.

This application is an Express and TypeScript REST API. It contains services for accounts, catalog, orders, payments, inventory, delivery, and store content.

## Local development

From this directory:

```powershell
npm install
npm run dev
```

The API runs at http://localhost:5000 by default. Its health endpoint is /api/health. Start the frontend separately; see the root README.

## Commands

- `npm run build` — compile and type-check backend TypeScript.
- `npm start` — start the API server.

## Database

Configure Supabase in backend/.env to use cloud persistence. Without Supabase, the API stores data in backend/data/database.json. The initial schema is in schema.sql; incremental changes are in migrations/.
