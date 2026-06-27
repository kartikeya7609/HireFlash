import express from 'express';
import { getUsers, toggleUserBan, toggleWorkerVerify, getBookings, getStats, trackVisit } from '../controllers/admin.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public visit tracking endpoint (no auth needed)
router.route('/track').post(trackVisit);

// Route-level middleware to enforce strict admin authorization
router.use(protect);
router.use(authorize('admin'));

router.route('/users').get(getUsers);
router.route('/users/:id/ban').put(toggleUserBan);
router.route('/workers/:id/verify').put(toggleWorkerVerify);
router.route('/bookings').get(getBookings);
router.route('/stats').get(getStats);

export default router;
