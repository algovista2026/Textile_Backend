import express from 'express';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../controllers/vendorController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getVendors)
  .post(protect, createVendor);

router.route('/:id')
  .put(protect, updateVendor)
  .delete(protect, deleteVendor);

export default router;
