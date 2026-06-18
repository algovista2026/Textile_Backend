import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { 
  getConsumptionAnalytics, 
  getPlannedVsActual 
} from '../controllers/advancedProductionController.js';

const router = express.Router();

router.use(protect);

router.get('/consumption', getConsumptionAnalytics);
router.get('/planned-vs-actual', getPlannedVsActual);

export default router;
