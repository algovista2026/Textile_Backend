import express from 'express';
import { authUser, getUserProfile, switchProfile } from '../controllers/authController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.post('/switch-profile', protect, admin, switchProfile);

export default router;
