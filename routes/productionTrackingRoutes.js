import express from "express";
import {
  getDashboardData,
  createOrder,
  updateOrder,
  deleteOrder,
  createDesign,
  updateDesign,
  deleteDesign,
  getPartyHistory,
  getMachineHistory,
  createMachine,
  updateMachine,
  deleteMachine
} from "../controllers/productionTrackingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/dashboard", getDashboardData);
router.post("/orders", createOrder);
router.put("/orders/:id", updateOrder);
router.delete("/orders/:id", deleteOrder);
router.post("/designs", createDesign);
router.put("/designs/:id", updateDesign);
router.delete("/designs/:id", deleteDesign);
router.get("/history/party/:partyName", getPartyHistory);
router.get("/history/machine/:machineId", getMachineHistory);
router.post("/machines", createMachine);
router.put("/machines/:id", updateMachine);
router.delete("/machines/:id", deleteMachine);

export default router;
