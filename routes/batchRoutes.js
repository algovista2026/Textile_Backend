import express from 'express';
import { getBatches } from '../controllers/batchController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getBatches);

export default router;
