import express from 'express';
import { getAlerts, markAsRead, markAllAsRead, deleteAlert } from '../controllers/alertController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAlerts);

router.route('/mark-all-read')
  .put(protect, markAllAsRead);

router.route('/:id/read')
  .put(protect, markAsRead);

router.route('/:id')
  .delete(protect, deleteAlert);

export default router;
