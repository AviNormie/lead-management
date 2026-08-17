# IntraCore

Multi-tenant CRM/ERP SaaS. Authentication is **Supabase Auth**. Application data is **Prisma + PostgreSQL**. Deploy on **Vercel**.

> `IntraCore-backend` is deprecated. All product code lives here.

## Architecture

- Next.js App Router — Server Components, Server Actions, Route Handlers
- Supabase Auth (`@supabase/ssr`) — cookie sessions
- Prisma User.id **equals** `auth.users.id` (UUID)
- Row-level tenancy via `organizationId`
- Permission-based RBAC (`lead.create`, never `role === "admin"`)
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** (`src/lib/supabase/admin.ts`). The browser client uses the **anon** key.

## Auth flow

Signup → Supabase `auth.users` → Prisma `User` (same UUID) → create Organization → Owner membership → dashboard.

Password reset and email confirmation go through `/auth/callback`.

## Setup

```bash
cp .env.example .env
# Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY (server only), DATABASE_URL, DIRECT_URL
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

In the Supabase dashboard, set redirect URLs:

- `http://localhost:3000/auth/callback`
- Production: `https://<your-domain>/auth/callback`

### Environment variables

| Variable | Client? | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon/public key for browser + cookie auth |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | Service role. Never import in `"use client"` files |
| `DATABASE_URL` | No | Pooled Postgres URL |
| `DIRECT_URL` | No | Direct/session URL for Prisma migrations |
| `NEXT_PUBLIC_SITE_URL` | Yes | App origin for invite/reset links |
| `ENCRYPTION_KEY` | No | Future integration credential encryption |

Never commit `.env` / `.env.local`.

## Lead Management

Org-scoped leads with configurable sources and pipelines (seeded on org create). Includes list/create/detail, notes, tasks, follow-ups, timeline, CSV import/export, duplicate warnings.

Permissions: `lead.create`, `lead.view`, `lead.edit`, `lead.delete`, `lead.assign`, `lead.import`, `lead.export`, `lead.convert`, `lead.change_stage`.

## Scripts

```bash
npm run dev
npm run build
npm test
npm run lint
```
