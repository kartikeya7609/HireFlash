import express from 'express';
import {
  createBooking,
  getBookings,
  acceptBooking,
  rejectBooking,
  completeBooking,
  cancelBooking
} from '../controllers/bookings.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All booking routes are protected
router.use(protect);

router.post('/', authorize('customer'), createBooking);
router.get('/', getBookings);

router.put('/:id/accept', authorize('worker'), acceptBooking);
router.put('/:id/reject', authorize('worker'), rejectBooking);
router.put('/:id/complete', authorize('worker'), completeBooking);
router.put('/:id/cancel', authorize('customer'), cancelBooking);

export default router;
