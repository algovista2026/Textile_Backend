import express from 'express';
import { triggerSync, saveConfig, getConfig } from '../controllers/sheetController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getConfig)
  .post(protect, admin, saveConfig);

router.post('/sync', protect, admin, triggerSync);

export default router;
