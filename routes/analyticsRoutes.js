import express from "express";
import { getExecutiveDashboard } from "../controllers/analyticsController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/executive-dashboard", protect, getExecutiveDashboard);

export default router;
