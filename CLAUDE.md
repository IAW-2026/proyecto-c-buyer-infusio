# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server with Turbopack
pnpm build        # production build
pnpm lint         # ESLint
pnpm dlx prisma migrate dev   # run pending migrations
pnpm dlx prisma generate      # regenerate Prisma client after schema changes
```

No test suite is configured yet.

## Architecture

**Infusio** is the buyer-facing app in a three-app microservices marketplace (Seller App, Buyer App, Shipping/Payments services). This repo is the Buyer App.

### Routing

- `app/(store)/` — public storefront: product catalog (`page.tsx`), product detail (`products/[id]`), limited edition (`edicion-limitada`). Wrapped by a layout that adds `Navbar` + `Footer`.
- `app/admin/` — admin dashboard (in progress).
- `app/layout.tsx` — root layout: wraps everything in `ClerkProvider`, loads fonts (Inter + Playfair Display).

### Service layer

All calls to external apps go through **`lib/services/externalApis.ts`**. It exports typed functions for the three external services:

| Function group | Env var | External app |
|---|---|---|
| `getProducts`, `getProductById`, `createPurchaseOrder`, `getPaymentUrl` | `SELLER_API_URL` | Seller App |
| `getShippingCost`, `getShipmentTracking`, `createShipment` | `SHIPPING_API_URL` | Shipping App |
| `getPaymentStatus`, `openDispute`, `getDisputeStatus` | `PAYMENTS_API_URL` | Payments App |

When calling from a server action or API route, pass the Clerk JWT token as the last argument.

### Mock API routes (dev only)

`app/api/seller/*`, `app/api/payments/*`, and `app/api/shipping/*` are local stubs that mirror the inter-app contracts. They return 404 in production. Point the service env vars at `http://localhost:3000/api/...` to run the full checkout flow without the other apps running.

### Database

Prisma + PostgreSQL via `lib/prisma.ts`. The client is generated to `generated/prisma/` (non-standard output path — always run `prisma generate` after schema changes).

Key design decision: `CartItem` snapshots `productName`, `productImageUrl`, and `priceAtTime` from the Seller API at add-to-cart time, so the cart display never needs to call the Seller API again.

User rows are created lazily in `POST /api/cart/items` via upsert — the Clerk webhook may not have fired yet when a user first adds to cart.

### UI / lib split

- `app/ui/` — all React components (server and client).
- `lib/` — actual project utilities: `prisma.ts` and `services/externalApis.ts`.
- `app/lib/` — **stale Next.js tutorial scaffolding** (invoices, customers, revenue). Not used by this project; should be replaced as migration progresses.

### Auth

Clerk handles auth. Use `auth()` from `@clerk/nextjs/server` in server components and API routes. The `userId` from Clerk is used directly as the primary key for the `User` model.

### Required env vars

```
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
SELLER_API_URL       # e.g. http://localhost:3001/api/seller
SHIPPING_API_URL     # e.g. http://localhost:3002/api/shipping
PAYMENTS_API_URL     # e.g. http://localhost:3003/api/payments
NEXT_PUBLIC_APP_URL  # used by mock payment routes
```
