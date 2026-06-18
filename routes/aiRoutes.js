import express from 'express';
import { generateInsights } from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/insights', protect, generateInsights);

export default router;
