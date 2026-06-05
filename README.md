# NovaCart — Modern E-Commerce

Production-grade multi-category e-commerce web application built with Next.js 14, Firebase, and Stripe.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Cloud Functions)
- **Images:** Local disk (`public/uploads/`) — served by Next.js
- **Payments:** Stripe Checkout + Webhooks
- **State:** Zustand (cart, auth)
- **Forms:** React Hook Form + Zod

## Prerequisites

- Node.js 20+
- Firebase project with Auth and Firestore enabled
- Stripe account (test mode for development)
- Firebase CLI (`npm install -g firebase-tools`)

## Setup

### 1. Clone and install

```bash
cd e-commerce
npm install
cd functions && npm install && cd ..
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Required keys:
- `NEXT_PUBLIC_FIREBASE_*` — from Firebase Console → Project settings
- `FIREBASE_ADMIN_*` — from Firebase Console → Service accounts → Generate new private key
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_BASE_URL` — `http://localhost:3000` for local dev
- `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` — for seed script

### 3. Firebase configuration

```bash
firebase login
firebase use your-project-id
```

Deploy security rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Enable **Email/Password** and **Google** sign-in in Firebase Authentication.

### 4. Seed database

```bash
npx ts-node scripts/seed.ts
```

This creates:
- 3 categories (Electronics, Fashion, Home & Kitchen)
- 20 sample products
- 1 admin user

### 5. Stripe webhook (local)

```bash
stripe listen --forward-to localhost:3000/api/checkout/webhook
```

Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### 6. Local image storage

All admin uploads (products, categories) are saved on the server:

```
public/uploads/
  products/{productId}/{timestamp}-{filename}.jpg
  categories/{categoryId}/{timestamp}-{filename}.jpg
  defaults/product.jpg   ← created by seed script
  defaults/category.jpg
```

- **API:** `POST /api/upload` (admin only) — form fields: `file`, `folder`, `entityId`
- **URLs in Firestore:** `/uploads/products/abc/1234-photo.jpg` (relative, served from `public/`)

Re-run seed to download default placeholder images:

```bash
npm run seed
```

### 7. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stripe Webhook (Production)

Deploy Cloud Functions:

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

Configure Stripe Dashboard webhook endpoint:
- URL: `https://us-central1-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`
- Event: `checkout.session.completed`
- Set secret in Firebase: `firebase functions:config:set stripe.secret_key="sk_..." stripe.webhook_secret="whsec_..."`

## Firebase Deployment

### Option A: Firebase App Hosting (recommended for new projects)

Use [Firebase App Hosting](https://firebase.google.com/docs/app-hosting) for Next.js SSR with GitHub integration.

### Option B: Firebase Hosting + Frameworks

If you have the web frameworks experiment enabled:

```bash
firebase experiments:enable webframeworks
firebase deploy
```

### Deploy rules and functions only

```bash
firebase deploy --only firestore,functions
```

Deploy Next.js separately to Vercel or App Hosting with the same environment variables.

## Project Structure

```
app/           # Next.js routes (shop, auth, admin, API)
components/    # UI, layout, product, cart, checkout, order, admin
lib/           # Firebase, Firestore, Stripe, auth, validations
hooks/         # useAuth, useCart, useWishlist, useProducts, useOrders
store/         # Zustand stores
functions/     # Cloud Functions (Stripe webhook)
scripts/       # seed.ts
types/         # TypeScript interfaces
```

## Features

- Email/password + Google authentication
- Product catalog with filters, search, pagination
- Cart (persisted) + multi-step Stripe checkout
- Order tracking with real-time Firestore updates
- Wishlist
- Admin dashboard (stats, products CRUD, order management)

## Admin Access

After seeding, login with your `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` and visit `/admin/dashboard`.

Middleware protects `/admin/*` routes — requires `role: admin` cookie set via `/api/auth/session`.

## Coupon Code (Demo)

Use `SAVE10` at checkout for 10% discount (UI/calculation stub).

## License

MIT
