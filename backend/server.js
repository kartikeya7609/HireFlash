import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import errorHandler from './middleware/error.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// CORS — raw middleware for maximum reliability
// Hardcoded production origins + env-var override support
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://hireflash.vercel.app',           // ← production Vercel frontend
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : [])
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Set CORS headers for every matching origin
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie');
  }

  // Respond to preflight immediately — do NOT pass to next()
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Serve local uploads folder statically
app.use('/uploads', express.static('uploads'));

// Route files
import authRoutes from './routes/auth.js';
import workerRoutes from './routes/workers.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the FastHire API Service' });
});

// Seed API endpoint for easy developer onboarding
import User from './models/User.js';
import WorkerProfile from './models/WorkerProfile.js';

app.post('/api/seed', async (req, res, next) => {
  try {
    // Clear existing database collections
    await User.deleteMany();
    await WorkerProfile.deleteMany();

    // Create 1 admin, 2 customers, and 5 workers (one for each category)
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@fasthire.com',
      password: 'password123',
      role: 'admin',
      phone: '123-456-7890',
      address: 'Admin Headquarters, NY'
    });

    const customer1 = await User.create({
      name: 'John Doe',
      email: 'john@gmail.com',
      password: 'password123',
      role: 'customer',
      phone: '987-654-3210',
      address: '123 Maple St, Queens'
    });

    const customer2 = await User.create({
      name: 'Sarah Smith',
      email: 'sarah@gmail.com',
      password: 'password123',
      role: 'customer',
      phone: '555-019-2834',
      address: '456 Oak Ave, Brooklyn'
    });

    // Workers definitions
    const workersData = [
      {
        name: 'David Miller',
        email: 'david.plumbing@work.com',
        role: 'worker',
        phone: '111-222-3333',
        address: '789 Pine Rd, Bronx',
        profile: {
          category: 'Plumbing',
          hourlyRate: 45,
          description: 'Emergency residential plumbing expert. 10+ years solving leaks, pipes, and drains.',
          experience: 8,
          location: 'Bronx',
          rating: 4.8
        }
      },
      {
        name: 'Elena Rostova',
        email: 'elena.spark@work.com',
        role: 'worker',
        phone: '444-555-6666',
        address: '101 Elm Blvd, Manhattan',
        profile: {
          category: 'Electrical',
          hourlyRate: 55,
          description: 'Certified master electrician specialized in smart home wiring and system repairs.',
          experience: 6,
          location: 'Manhattan',
          rating: 4.9
        }
      },
      {
        name: 'Alex Johnson',
        email: 'alex.tutor@work.com',
        role: 'worker',
        phone: '777-888-9999',
        address: '202 Birch Dr, Staten Island',
        profile: {
          category: 'Tutoring',
          hourlyRate: 35,
          description: 'Passionate math and science tutor helping high schoolers ace their exams.',
          experience: 4,
          location: 'Staten Island',
          rating: 4.7
        }
      },
      {
        name: 'Maria Santos',
        email: 'maria.clean@work.com',
        role: 'worker',
        phone: '222-333-4444',
        address: '303 Cedar Way, Queens',
        profile: {
          category: 'Cleaning',
          hourlyRate: 25,
          description: 'Professional deep-cleaning services for apartments and commercial spaces.',
          experience: 5,
          location: 'Queens',
          rating: 4.6
        }
      },
      {
        name: 'Robert Wood',
        email: 'robert.carpentry@work.com',
        role: 'worker',
        phone: '888-999-0000',
        address: '404 Walnut Ln, Brooklyn',
        profile: {
          category: 'Carpentry',
          hourlyRate: 50,
          description: 'Custom furniture crafting, cabinet installation, and custom framing designs.',
          experience: 12,
          location: 'Brooklyn',
          rating: 4.9
        }
      }
    ];

    const seededWorkers = [];
    for (const w of workersData) {
      const user = await User.create({
        name: w.name,
        email: w.email,
        password: 'password123',
        role: w.role,
        phone: w.phone,
        address: w.address
      });

      const profile = await WorkerProfile.create({
        user: user._id,
        ...w.profile
      });

      seededWorkers.push({ user, profile });
    }

    res.status(200).json({
      success: true,
      message: 'Database seeded with clean startup data successfully!',
      seeded: {
        admin,
        customers: [customer1, customer2],
        workers: seededWorkers
      }
    });
  } catch (error) {
    next(error);
  }
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
});
