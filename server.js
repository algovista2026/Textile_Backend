import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import connectDB from "./config/db.js";

// Import all models to ensure they are registered with Mongoose
import "./models/Batch.js";
import "./models/Chemical.js";
import "./models/ChemicalConsumption.js";
import "./models/ChemicalPurchase.js";
import "./models/Client.js";
import "./models/Cost.js";
import "./models/Design.js";
import "./models/Fabric.js";
import "./models/Invoice.js";
import "./models/Inward.js";
import "./models/Machine.js";
import "./models/MachineHistory.js";
import "./models/Operator.js";
import "./models/Process.js";
import "./models/ProductionDesign.js";
import "./models/ProductionOrder.js";
import "./models/QualityInspection.js";
import "./models/Recipe.js";
import "./models/SheetConfig.js";
import "./models/StageEvent.js";
import "./models/User.js";
import "./models/UtilityConsumption.js";
import "./models/MaterialMaster.js";
import "./models/Warehouse.js";
import "./models/WarehouseStock.js";
import "./models/WarehouseTransfer.js";
import "./models/RecipeMaster.js";
import "./models/Vendor.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import sheetRoutes from "./routes/sheetRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import productionTrackingRoutes from "./routes/productionTrackingRoutes.js";
import {
  getGenericData,
  createGenericData,
  updateGenericData,
  deleteGenericData,
} from "./controllers/genericController.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import advancedProductionRoutes from "./routes/advancedProductionRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import { protect } from "./middlewares/authMiddleware.js";

dotenv.config();
connectDB();

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sheets", sheetRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/production-tracking", productionTrackingRoutes);
app.use("/api/inventory-advanced", inventoryRoutes);
app.use("/api/production-advanced", advancedProductionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/alerts", alertRoutes);

// Generic Route for Phase 2 dynamic modules
app.get("/api/generic/:modelName", protect, getGenericData);
app.post("/api/generic/:modelName", protect, createGenericData);
app.put("/api/generic/:modelName/:id", protect, updateGenericData);
app.delete("/api/generic/:modelName/:id", protect, deleteGenericData);

app.get("/", (req, res) => {
  res.send("Textile ERP API is running...");
});

// Temporary Seed Route
app.get("/api/seed-admin", async (req, res) => {
  try {
    const User = (await import("./models/User.js")).default;
    await User.deleteMany();
    const adminUser = new User({
      username: "Admin",
      password: "Algo2026",
      role: "admin",
      permissions: [
        "dashboard",
        "inward",
        "processes",
        "reports",
        "settings",
        "user_management",
      ],
    });
    await adminUser.save();
    res.send("✅ Admin user seeded successfully! You can now login.");
  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
