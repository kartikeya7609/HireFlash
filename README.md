# FastHire - Local Worker On-Demand Service Marketplace 🛠️

FastHire is a production-ready, clean, scalable full-stack MERN (MongoDB, Express, React, Node.js) startup template. It represents an on-demand service booking engine where customers can browse, filter, and hire local professional specialists (plumbers, electricians, tutors, cleaners, carpenters).

Designed with a sleek, dark-themed glassmorphism visual layout, it provides a premium client-side user experience with role-based routing controls.

---

## 📂 Repository Architectural Structure

```
fashire/ (Root Workspace)
├── backend/
│   ├── config/             # DB connection helpers
│   ├── middleware/         # Express unified global error catchers
│   ├── models/             # Mongoose schemas (User, WorkerProfile)
│   ├── routes/             # Express API controllers (Auth, Workers)
│   ├── server.js           # Express bootstrap entrypoint with auto-seeder route
│   ├── .env                # Server environmental parameters
│   └── package.json        # Backend operating scripts and libraries
└── frontend/
    ├── src/
    │   ├── components/     # Session-aware Navbar, Footer
    │   ├── pages/          # Home (showcase), Workers (filters), Details, Auth, Dashboard
    │   ├── App.jsx         # React Router page bindings
    │   ├── index.css       # Premium custom vanilla CSS design system variables
    │   └── main.jsx        # React DOM initialization anchor
    ├── index.html          # Global document markup loading Outfit/Jakarta fonts
    ├── vite.config.js      # Vite compilation configurations with backend proxy
    └── package.json        # Frontend React router compiler dependencies
```

---

## 🚀 Setup & Launch Workflow

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on standard port `27017` (or Atlas cloud instance).

---

### Step 1: Boot Backend API Service
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm operational dependencies:
   ```bash
   npm install
   ```
3. Boot the Express API server in development hot-reload mode:
   ```bash
   npm run dev
   ```
   *The Express API service is active at `http://localhost:5000`.*

---

### Step 2: Boot Frontend React Client
1. In a separate terminal session, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install client-side router packages:
   ```bash
   npm install
   ```
3. Launch the Vite hot-compiler:
   ```bash
   npm run dev
   ```
   *The FastHire customer portal is live at `http://localhost:5173`.*

---

## ⚡ Instant Database Seeding

To immediately inspect full dashboard statistics, listings filters, search matching, and booking logs without manually entering records:
1. Boot both services.
2. Visit the homepage at `http://localhost:5173`.
3. If the database is empty, a prominent button **"Auto-Seed Database Instantly"** will be displayed. Click it!
4. It fires a `POST` request to `/api/seed`, dropping collections and populating fresh mock records including:
   - **System Admin**: `admin@fasthire.com` (password: `password123`)
   - **Pre-seeded Customer**: `john@gmail.com` (password: `password123`)
   - **Specialist Workers**: Individual, verified master profiles for Plumbers, Electricians, Tutors, Cleaners, and Carpenters!
