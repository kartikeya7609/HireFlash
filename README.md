# ⚡ HireFlash

### A Production-Grade On-Demand Service Marketplace Platform

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![Stream Chat](https://img.shields.io/badge/Stream-Chat%20SDK-005FFF?logo=stream&logoColor=white)](https://getstream.io)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-DaisyUI-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Authentication Flow](#-authentication-flow)
- [Role System](#-role-system)
- [Real-Time Chat](#-real-time-chat)
- [Security Architecture](#-security-architecture)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Future Roadmap](#-future-roadmap)
- [Author](#-author)

---

## 🌟 Overview

**HireFlash** is a full-stack, production-ready service marketplace that connects customers with skilled local professionals — plumbers, electricians, tutors, cleaners, and carpenters — through an intuitive, real-time enabled web platform.

Built with a security-first mindset and scalable architecture, HireFlash handles the complete user journey: **registration → authentication → worker discovery → booking → real-time chat → admin oversight**. The platform integrates Firebase for identity management, Stream Chat for enterprise-grade real-time messaging, Cloudinary for image hosting, and EmailJS for transactional OTP delivery.

> HireFlash — hire the right person, in a flash.

---

## ✨ Features

### 🔐 Authentication & Identity

- Email/password registration with **OTP-based email verification** (5-min expiry, 6-digit)
- **Google OAuth 2.0** sign-in via Firebase Authentication
- **Firebase ↔ MongoDB sync** — auto-registers Firebase users into the backend on first sign-in
- JWT tokens stored in **httpOnly cookies** (30-day expiry by default)
- Role-based route guards: unauthenticated → customer → worker → admin

### 👷 Worker Discovery

- Browse workers by **5 service categories**: Plumbing, Electrical, Tutoring, Cleaning, Carpentry
- **Search** workers by name, category, or location
- **Filter** by availability and verification status
- Paginated worker listings with TanStack Query caching
- Detailed worker profile pages with ratings, hourly rate, experience, bio, skills, and profile image

### 📅 Booking System

- Customers create bookings with target date, time slot, service notes, and hourly rate
- **Full booking lifecycle**: `pending → accepted → rejected → completed / cancelled`
- Workers accept or reject incoming booking requests
- Customers cancel unaccepted bookings
- Dashboard views scoped by role (customer sees their bookings; workers see incoming requests)

### 💬 Real-Time Chat

- **Embedded chat widget** powered by Stream Chat SDK
- Customer ↔ Worker direct messaging channels
- Typing indicators and message read states
- Stream Chat token issued by the backend (`/api/auth/stream-token`)
- Avatar sync with Cloudinary profile images or DiceBear initials fallback

### 🛡 Admin Command Center

- Secure **Admin Dashboard** (role-gated: `admin` only)
- View and ban/unban any user
- **Verify or unverify** worker profiles with one click
- Monitor all bookings platform-wide
- Platform-wide stats: total users, workers, bookings, revenue

### 🖼 Image Uploads

- Worker profile image upload via **Cloudinary** (multer multipart pipeline)
- Automatic URL storage in `WorkerProfile.profileImageUrl`
- Fallback to DiceBear avatar on Stream Chat if no image set

### 📧 Email System

- OTP verification emails with **branded HTML templates** (yellow-accent FasHire design)
- Delivered via **Nodemailer** with SMTP (Ethereal fallback for development)
- EmailJS integration on the frontend for supplementary client-side email flows

### 🎨 UI/UX

- **Dark/light mode** responsive design (Tailwind CSS + DaisyUI)
- **Framer Motion** page and component animations
- Loading skeletons throughout worker browse and dashboard screens
- Fully responsive: mobile-first navigation with bottom tab bar for mobile, sidebar for desktop
- Custom **HireFlash lightning bolt SVG brand logo** with Lucide icons

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Build tool & HMR |
| React Router 6 | Client-side routing |
| TanStack Query 5 | Server state management & caching |
| Zustand | Client state (auth store, theme) |
| Firebase 12 | Google OAuth & email auth |
| Stream Chat SDK 9 | Real-time messaging UI |
| Tailwind CSS + DaisyUI 5 | Utility-first styling + component library |
| Framer Motion 12 | Page & element animations |
| Lucide React | Icon library |
| Axios | HTTP client with cookie support |
| EmailJS Browser | Client-side email delivery |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express 4 | HTTP server & routing |
| MongoDB + Mongoose 8 | Database & ODM |
| JWT (jsonwebtoken) | Access token generation (30d expiry) |
| Bcryptjs | Password hashing (salt rounds 10) |
| Cloudinary + Multer | Image upload & cloud storage |
| Nodemailer | Transactional OTP email delivery |
| Stream Chat (server SDK) | Token issuance + user upsert |
| Cookie Parser | httpOnly JWT cookie handling |
| CORS | Explicit origin credential policy |

---

## 🏗 Architecture

```
┌──────────────┐     ┌─────────────────────────────────┐     ┌──────────────┐
│   Browser    │────▶│         Express Server           │────▶│   MongoDB    │
│  (React SPA) │     │  JWT Auth · Role Guards · CORS   │     │  (Mongoose)  │
└──────┬───────┘     └──────┬──────────────┬────────────┘     └──────────────┘
       │                    │              │
       │  Firebase Auth      │  REST API    │  Cloudinary Upload
       ▼                    ▼              ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Firebase    │     │  Stream Chat │     │   Cloudinary     │
│  Google OAuth│     │  Cloud SDK   │     │   Image CDN      │
│  OTP Email   │     │  WebSocket   │     │   Worker Photos  │
└──────────────┘     └──────────────┘     └──────────────────┘
```

**Request Flow:**

1. Client authenticates via Firebase (Google) or email OTP → backend syncs user to MongoDB
2. JWT cookie issued on every successful auth (30-day expiry, httpOnly)
3. All subsequent API calls include the cookie automatically (Axios `withCredentials`)
4. Stream Chat client connects via WebSocket using server-generated token
5. Worker images uploaded to Cloudinary via multer pipeline; URL stored in `WorkerProfile`
6. Admin actions (ban, verify, stats) flow through `/api/admin` with strict `authorize('admin')` guard

---

## 📁 Project Structure

```
hireflash/
├── backend/
│   ├── config/
│   │   └── db.js                     # MongoDB connection
│   ├── controllers/
│   │   ├── auth.js                   # Register, login, OTP, Firebase sync, Stream token
│   │   ├── workers.js                # Worker profile CRUD, paginated listing, search/filter
│   │   ├── bookings.js               # Create, list, accept, reject, complete, cancel
│   │   └── admin.js                  # User management, worker verification, stats
│   ├── middleware/
│   │   ├── auth.js                   # JWT protect + role-based authorize()
│   │   └── error.js                  # Centralized error handler
│   ├── models/
│   │   ├── User.js                   # User schema (roles, OTP, ban flag, JWT method)
│   │   ├── WorkerProfile.js          # Worker profile (category, rate, skills, verification)
│   │   └── Booking.js                # Booking schema (lifecycle status enum)
│   ├── routes/
│   │   ├── auth.js                   # /api/auth/*
│   │   ├── workers.js                # /api/workers/*
│   │   ├── bookings.js               # /api/bookings/*
│   │   ├── admin.js                  # /api/admin/* (admin only)
│   │   └── upload.js                 # /api/upload/* (Cloudinary)
│   ├── utils/
│   │   └── sendEmail.js              # Nodemailer transporter + OTP email dispatch
│   ├── clearDb.js                    # One-shot DB clear utility script
│   ├── .env.example                  # Environment variable template
│   ├── server.js                     # Entry point, middleware, seed endpoint
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                      # Axios API call functions
│   │   ├── components/
│   │   │   ├── BrandLogo.jsx         # HireFlash lightning bolt SVG logo
│   │   │   ├── Navbar.jsx            # Top nav with role-aware links
│   │   │   ├── Footer.jsx            # Responsive bottom navigation
│   │   │   └── ChatWidget.jsx        # Embedded Stream Chat UI widget
│   │   ├── pages/
│   │   │   ├── Home.jsx              # Landing page with hero + feature sections
│   │   │   ├── Login.jsx             # Email/password + Google OAuth + OTP flow
│   │   │   ├── Register.jsx          # Role selection (customer/worker) + profile setup
│   │   │   ├── Workers.jsx           # Paginated worker listing with search + filter
│   │   │   ├── WorkerDetails.jsx     # Individual worker profile + booking form
│   │   │   ├── Dashboard.jsx         # Role-scoped: bookings, profile, admin stats
│   │   │   ├── Auth.jsx              # OTP verification step page
│   │   │   └── AdminDashboard.jsx    # Admin: users, workers, bookings, stats
│   │   ├── store/
│   │   │   └── useAuthStore.js       # Zustand auth state (user, token, actions)
│   │   ├── firebase.js               # Firebase app initialization
│   │   ├── App.jsx                   # Routes + global layout
│   │   ├── index.css                 # Tailwind directives + global styles
│   │   └── main.jsx                  # ReactDOM root + QueryClient
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── .gitignore
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or Atlas)
- **Firebase** project with Authentication enabled (Email/Password + Google provider)
- **Stream Chat** account (free tier works)
- **Cloudinary** account (free tier works)
- **EmailJS** account (or SMTP credentials via Nodemailer)

### Clone & Install

```bash
git clone https://github.com/kartikeya7609/HireFlash.git
cd HireFlash

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Seed the Database (Optional)

After starting the backend, seed it with sample admin, customers, and workers:

```bash
curl -X POST http://localhost:5000/api/seed
```

This creates **1 admin**, **2 customers**, and **5 workers** (one per category) with password `password123`.

---

## 🔐 Environment Configuration

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/hireflash

# JWT
JWT_SECRET=<your-long-random-secret>
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Cloudinary (for worker profile image uploads)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Stream Chat (real-time messaging)
STREAM_API_KEY=<your-stream-api-key>
STREAM_API_SECRET=<your-stream-api-secret>

# SMTP / Nodemailer (OTP emails)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-password>
SMTP_FROM="HireFlash <noreply@hireflash.com>"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_STREAM_API_KEY=<same-as-backend-stream-api-key>

# Firebase project config
VITE_FIREBASE_API_KEY=<firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
VITE_FIREBASE_APP_ID=<app-id>

# EmailJS (client-side OTP email)
VITE_EMAILJS_SERVICE_ID=<service-id>
VITE_EMAILJS_TEMPLATE_ID=<template-id>
VITE_EMAILJS_PUBLIC_KEY=<public-key>
```

### Run Development

```bash
# Terminal 1 — Backend
cd backend
npm run dev    # Starts on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev    # Starts on http://localhost:5173
```

---

## 🔄 Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │   Firebase   │     │  Server  │     │ MongoDB  │
└────┬─────┘     └──────┬───────┘     └────┬─────┘     └────┬─────┘
     │                  │                   │                 │
     │  Email OTP Flow  │                   │                 │
     │──────────────────────────────────────▶ POST /api/auth/send-otp
     │                  │                   │  Generate OTP   │
     │                  │                   │  Save to User   ──▶
     │                  │                   │  Send email     │
     │  { developmentOtp }                  │                 │
     │◀─────────────────────────────────────│                 │
     │                  │                   │                 │
     │──────────────────────────────────────▶ POST /api/auth/verify-otp
     │                  │                   │  Validate OTP   ──▶
     │                  │                   │  Issue JWT      │
     │  { token, user } │                   │                 │
     │◀─────────────────────────────────────│                 │
     │                  │                   │                 │
     │  Google OAuth Flow                   │                 │
     │──────────────────▶ signInWithPopup   │                 │
     │  { idToken, email, name }            │                 │
     │◀─────────────────│                   │                 │
     │──────────────────────────────────────▶ POST /api/auth/firebase-sync
     │                  │                   │  Find or Create ──▶
     │                  │                   │  Issue JWT      │
     │  { token, user } │                   │                 │
     │◀─────────────────────────────────────│                 │
```

**Token Lifecycle:**

| Token | Expiry | Storage |
|---|---|---|
| JWT | 30 days (configurable) | httpOnly cookie |

**Route Protection (3 tiers):**

| Tier | Access |
|---|---|
| Not authenticated | `/login`, `/register`, `/auth` only |
| Authenticated (customer) | `/`, `/workers`, `/workers/:id`, `/dashboard` |
| Authenticated (admin) | All above + `/dashboard` with admin stats view |

---

## 👥 Role System

HireFlash uses a three-tier role model enforced at both the route-middleware and data-query levels:

| Role | Capabilities |
|---|---|
| `customer` | Browse workers, create bookings, cancel own bookings, use chat |
| `worker` | Manage own profile (CRUD), accept/reject/complete bookings, use chat |
| `admin` | View all users/workers/bookings, ban users, verify workers, see platform stats |

Role is set at registration and stored on the `User` document. The `authorize(...roles)` middleware on the backend enforces access at every protected route.

---

## 💬 Real-Time Chat

HireFlash embeds a **Stream Chat widget** that appears for all authenticated users, enabling direct messaging between customers and workers.

```
Customer opens WorkerDetails page
        │
        ▼
"Chat with Worker" button triggers ChatWidget
        │
        ▼
Frontend calls GET /api/auth/stream-token
        │
        ▼
Backend creates Stream Chat token + upserts user (name, avatar)
        │
        ▼
Stream Chat client connects via WebSocket
        │
        ▼
Deterministic channel: sorted([customerId, workerId]).join("-")
        │
        ▼
Messages flow through Stream Cloud → both parties in real-time
```

- **Token Security:** Server-side generated, scoped to the authenticated user's MongoDB `_id`
- **Avatar Sync:** Worker's Cloudinary `profileImageUrl` is passed to Stream; falls back to DiceBear initials avatar
- **Channel ID Strategy:** Sorted user ID pair ensures only one channel exists per customer-worker pair

---

## 🛡 Security Architecture

| Measure | Implementation |
|---|---|
| Password Hashing | bcrypt with salt rounds 10 (Mongoose `pre('save')` hook) |
| JWT Storage | httpOnly cookie, `secure: true` in production, `sameSite: lax` |
| Route Protection | `protect` middleware validates JWT on every private route |
| Role Enforcement | `authorize(...roles)` middleware on all role-sensitive routes |
| Ban Protection | `isBanned` check on user model, enforced in `protect` middleware |
| OTP Security | 6-digit numeric, 5-minute expiry, cleared after successful verification |
| Firebase Sync | Auto-creates MongoDB user on first Google sign-in with random hashed password |
| CORS | Explicit `FRONTEND_URL` origin, `credentials: true` |
| Admin Guard | Double-layered: `protect` + `authorize('admin')` on all `/api/admin` routes |
| Password Selection | `select: false` on password field — excluded from all query results by default |

---

## 📡 API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register with email + password (+ optional worker details) |
| POST | `/login` | No | Login with email + password, returns JWT cookie |
| POST | `/logout` | No | Clears JWT cookie |
| POST | `/send-otp` | No | Generate & email 6-digit OTP (auto-creates user if new) |
| POST | `/verify-otp` | No | Verify OTP, returns JWT cookie |
| POST | `/firebase-sync` | No | Sync Firebase-authenticated user to MongoDB |
| GET | `/me` | Yes | Get current authenticated user + worker profile |
| GET | `/stream-token` | Yes | Generate Stream Chat token + upsert user on Stream |
| PUT | `/update-profile` | Yes | Update phone and address |

### Workers (`/api/workers`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | No | — | List all workers (with search, filter, pagination) |
| GET | `/:id` | No | — | Get single worker by User ID |
| GET | `/profile/me` | Yes | worker | Get own worker profile |
| POST | `/profile` | Yes | worker | Create worker profile |
| PUT | `/profile` | Yes | worker | Update own worker profile |
| DELETE | `/profile` | Yes | worker | Delete own worker profile |

### Bookings (`/api/bookings`) — All require auth

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/` | customer | Create a new booking |
| GET | `/` | any | List bookings scoped to the current user's role |
| PUT | `/:id/accept` | worker | Accept a pending booking |
| PUT | `/:id/reject` | worker | Reject a pending booking |
| PUT | `/:id/complete` | worker | Mark a booking as completed |
| PUT | `/:id/cancel` | customer | Cancel a pending booking |

### Admin (`/api/admin`) — Requires `admin` role

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List all users |
| PUT | `/users/:id/ban` | Toggle user ban status |
| PUT | `/workers/:id/verify` | Toggle worker verification status |
| GET | `/bookings` | List all bookings platform-wide |
| GET | `/stats` | Platform statistics (user count, booking count, revenue) |

### Upload (`/api/upload`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Yes | Upload image to Cloudinary, returns `{ url }` |

### System

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API health check / welcome message |
| POST | `/api/seed` | Seed database with demo users and workers |

---

## 🌐 Deployment

### Production Build

```bash
cd frontend
npm run build
# Outputs optimized bundle to frontend/dist/
```

### Deploy on Render / Railway / Fly.io

```bash
# Build Command
cd frontend && npm install && npm run build && cd ../backend && npm install

# Start Command
cd backend && NODE_ENV=production node server.js
```

To serve the frontend from the backend in production, add to `server.js`:

```js
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}
```

### Post-Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_URL` to your production domain
- [ ] Generate a strong `JWT_SECRET` (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
- [ ] Set all Cloudinary, Firebase, Stream, and EmailJS env vars
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Add your production domain to Firebase's **Authorized Domains** list
- [ ] Verify CORS `FRONTEND_URL` matches your production origin
- [ ] Test: `curl https://yourdomain.com/api/` → `{ "message": "Welcome to the FastHire API Service" }`

---

## 🧪 Testing

```bash
# Verify backend starts correctly
cd backend && node server.js

# Seed with test data
curl -X POST http://localhost:5000/api/seed

# Test login with seeded admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fasthire.com","password":"password123"}'

# Check a protected route
curl http://localhost:5000/api/auth/me --cookie "token=<your-jwt>"

# Build frontend for compilation check
cd frontend && npm run build
```

---

## 🗺 Future Roadmap

- [ ] **Real-time booking notifications** via Stream Chat or WebSocket (replaces manual dashboard refresh)
- [ ] **Reviews & ratings** — customers rate workers post-completion, updates displayed `rating` field
- [ ] **Geolocation filter** — location-aware worker recommendations using Haversine formula
- [ ] **Stripe payments** — integrated booking deposits and escrow-style payment release
- [ ] **Worker availability calendar** — visual time-slot picker with conflict detection
- [ ] **Mobile push notifications** via Firebase Cloud Messaging (FCM)
- [ ] **Redis cache** for JWT token invalidation and high-frequency worker listing queries
- [ ] **Docker Compose** for one-command local development environment
- [ ] **CI/CD pipeline** with GitHub Actions (lint → test → deploy)
- [ ] **End-to-end tests** with Playwright
- [ ] **Language / locale support** for international marketplace expansion

---

## 👤 Author

**Kartikeya**

[![GitHub](https://img.shields.io/badge/GitHub-kartikeya7609-181717?logo=github)](https://github.com/kartikeya7609)

---

> If you found this project useful, consider giving it a ⭐ on GitHub!

*Made with ⚡ and coffee*
