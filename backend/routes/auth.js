import express from 'express';
import { register, login, logout, getMe, getStreamToken, sendOtp, verifyOtp, firebaseSync, updateProfile } from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/firebase-sync', firebaseSync);

// Private auth routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/stream-token', protect, getStreamToken);
router.put('/update-profile', protect, updateProfile);

export default router;
