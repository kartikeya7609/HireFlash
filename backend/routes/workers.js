import express from 'express';
import { 
  getWorkers, 
  getWorker, 
  getMyProfile, 
  createMyProfile, 
  updateMyProfile, 
  deleteMyProfile 
} from '../controllers/workers.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getWorkers);

// Private worker profile CRUD routes (must be defined BEFORE static /:id route to avoid conflict)
router.get('/profile/me', protect, authorize('worker'), getMyProfile);
router.post('/profile', protect, authorize('worker'), createMyProfile);
router.put('/profile', protect, authorize('worker'), updateMyProfile);
router.delete('/profile', protect, authorize('worker'), deleteMyProfile);

// Dynamic routes (Public lookup by ID)
router.get('/:id', getWorker);

export default router;
