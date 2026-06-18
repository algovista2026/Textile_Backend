import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { 
  getMaterialKPIs, 
  getWarehouseKPIs, 
  getWarehouseDetails, 
  transferStock 
} from '../controllers/inventoryController.js';

const router = express.Router();

router.use(protect);

router.get('/material-kpis', getMaterialKPIs);
router.get('/warehouse-kpis', getWarehouseKPIs);
router.get('/warehouse/:id', getWarehouseDetails);
router.post('/transfer', transferStock);

export default router;
