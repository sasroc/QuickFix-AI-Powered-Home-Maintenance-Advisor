# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**QuickFix AI** is a full-stack web app that provides AI-powered home maintenance guidance. Users describe repair issues (text/voice/image) and receive step-by-step repair instructions powered by OpenAI GPT-4o, with a credit-based subscription system.

## Development Commands

### Root (runs both services concurrently)
```bash
npm run install-all    # Install all dependencies (frontend + backend)
npm run dev            # Start both backend (port 4000) and frontend (port 3000)
npm run build          # Build both for production
npm run test           # Run tests for both
```

### Backend only (`cd backend`)
```bash
npm run dev     # nodemon with auto-reload
npm run build   # TypeScript → dist/
npm start       # Run compiled dist/app.js
npm test        # Run tests
```

### Frontend only (`cd frontend`)
```bash
npm start   # CRA dev server via craco (port 3000)
npm run build
npm test
```

No explicit lint scripts are configured. Backend uses TypeScript strict mode for type checking.

## Architecture

**Stack**: React 19 + Chakra UI (frontend, JS) → Express + TypeScript (backend) → Firebase Firestore (database) + Firebase Auth + OpenAI GPT-4o + Stripe + SendGrid.

**Deployments**: Frontend on Netlify, Backend on Railway. Both auto-deploy from `main`.

### Request Flow
```
User Input (text/voice/image)
  → RepairPage.js (frontend)
  → POST /api/ai/analyze (axios via aiService.js)
  → decodeToken middleware (Firebase JWT validation)
  → rateLimiter middleware (tiered by subscription)
  → ai.controller.ts → cache check → OpenAI call → cache store
  → credit deducted from Firestore user doc
  → repair saved to Firestore repairs collection
  → JSON response rendered in frontend
```

### Auth Flow
Firebase Auth issues ID tokens → passed as `Authorization: Bearer <token>` header → `decodeToken.ts` middleware validates → `optionalAuth.ts` for public endpoints (anonymous users get 5 req/15min, authenticated get 20).

### State Management
React Context only (no Redux):
- `AuthContext.js` — Firebase user + Firestore `userData` (subscription, credits)
- `ThemeContext.js` — dark/light mode
- `useCreateUserInFirestore.js` — auto-creates Firestore user doc on first sign-in

### Credit & Subscription System
- Plans: Starter (10 credits/mo), Pro (25), Premium (100)
- Each AI analysis costs 1 credit
- Stripe webhooks (`checkout.session.completed`, `invoice.paid`) update Firestore user doc
- **Lifetime Access**: Special tier (`subscriptionStatus: "lifetime"`) that monthly-resets to 10 credits without Stripe; admin-granted only; bypasses all webhook processing

### Caching
In-memory cache in `backend/src/services/cacheService.ts` — AI responses cached 5 min TTL by issue hash. Reduces OpenAI API costs for repeated queries.

## Key File Locations

| Purpose | Path |
|---|---|
| AI analysis endpoint | `backend/src/controllers/ai.controller.ts` |
| Stripe webhooks | `backend/src/controllers/stripe.controller.ts` |
| Rate limiting config | `backend/src/middleware/rateLimiter.ts` |
| Firebase Admin init | `backend/src/utils/firebaseAdmin.ts` |
| Frontend API calls | `frontend/src/services/aiService.js` |
| API base URL config | `frontend/src/services/apiConfig.js` |
| Auth context + user data | `frontend/src/contexts/AuthContext.js` |
| Main router + routes | `frontend/src/App.js` |
| Firebase client init | `frontend/src/config/firebase.js` |
| Firestore security rules | `firestore.rules` |
| Netlify config (SPA routing, headers) | `netlify.toml` |

## Important Patterns

**Protected routes**: `ProtectedRoute.js` wraps routes requiring auth; `AdminRoute.js` additionally checks `userData.isAdmin`.

**Error handling**: Controllers use try/catch → global `errorHandler.ts` middleware → Sentry + Winston logging. Custom `AppError` class for consistent error responses.

**Backend TypeScript**: Strict mode enabled. New backend files should be `.ts` in `src/`, compiled to `dist/`.

**Frontend is JavaScript**: The frontend uses `.js` (not `.tsx`). Chakra UI for all components; Framer Motion for animations.

**Firestore collections**: `users/` (profiles + subscription), `repairs/` (history per user), `feedback/` (submissions).

## Environment Variables

**Backend** (`backend/.env`): `OPENAI_API_KEY`, `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_*_PRICE_ID` (one per plan), `STRIPE_WEBHOOK_SECRET`, `SENDGRID_API_KEY`, `SENTRY_DSN`, `FRONTEND_URL`, `PORT=4000`, `NODE_ENV`.

**Frontend** (`frontend/.env`): `REACT_APP_API_URL`, `REACT_APP_FIREBASE_*` (6 vars), `REACT_APP_STRIPE_PUBLIC_KEY`, `REACT_APP_SENTRY_DSN`.
