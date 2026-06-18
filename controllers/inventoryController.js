import Chemical from "../models/Chemical.js";
import Warehouse from "../models/Warehouse.js";
import WarehouseStock from "../models/WarehouseStock.js";
import WarehouseTransfer from "../models/WarehouseTransfer.js";

export const getMaterialKPIs = async (req, res) => {
  try {
    const materials = await Chemical.find();

    const totalMaterials = materials.length;
    const activeMaterials = materials.length; // Default all active
    const lowStockMaterials = materials.filter(
      (m) => m.currentStock <= m.reorderLevel,
    ).length;
    const inventoryValue = materials.reduce(
      (acc, m) => acc + m.currentStock * m.rateInrUnit,
      0,
    );

    // Category Distribution
    const categoryDist = {};
    materials.forEach((m) => {
      categoryDist[m.category] = (categoryDist[m.category] || 0) + 1;
    });

    const categoryChart = Object.keys(categoryDist).map((key) => ({
      name: key,
      value: categoryDist[key],
    }));

    // Top Value
    const topValueMaterials = [...materials]
      .sort(
        (a, b) =>
          b.currentStock * b.rateInrUnit - a.currentStock * a.rateInrUnit,
      )
      .slice(0, 5)
      .map((m) => ({
        name: m.chemicalName,
        value: m.currentStock * m.rateInrUnit,
      }));

    res.json({
      totalMaterials,
      activeMaterials,
      lowStockMaterials,
      inventoryValue,
      categoryChart,
      topValueMaterials,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWarehouseKPIs = async (req, res) => {
  try {
    let warehouses = await Warehouse.find();

    // Seed random warehouses if none exist
    if (warehouses.length === 0) {
      const defaultWarehouses = [
        {
          warehouseCode: "WH-MAIN",
          warehouseName: "Main Chemical Store",
          location: "Block A, Ground Floor",
          managerName: "Rajesh Kumar",
          contactNumber: "+91 9876543210",
        },
        {
          warehouseCode: "WH-PRINT",
          warehouseName: "Printing Sub-Store",
          location: "Printing Department",
          managerName: "Amit Sharma",
          contactNumber: "+91 9876543211",
        },
        {
          warehouseCode: "WH-DYE",
          warehouseName: "Dyeing Sub-Store",
          location: "Dyeing Department",
          managerName: "Vikram Singh",
          contactNumber: "+91 9876543212",
        },
        {
          warehouseCode: "WH-FIN",
          warehouseName: "Finishing Store",
          location: "Finishing Department",
          managerName: "Suresh Patel",
          contactNumber: "+91 9876543213",
        },
      ];
      warehouses = await Warehouse.insertMany(defaultWarehouses);
    }

    let stocks = await WarehouseStock.find().populate("material");
    const materials = await Chemical.find();

    // Seed random stocks if none exist
    if (stocks.length === 0 && materials.length > 0 && warehouses.length > 0) {
      const mockStocks = [];
      for (const material of materials) {
        // Distribute stock randomly across warehouses
        let remainingStock =
          material.currentStock || Math.floor(Math.random() * 500) + 100;
        for (const wh of warehouses) {
          if (remainingStock <= 0) break;
          // Randomly decide if this warehouse holds this material
          if (Math.random() > 0.3) {
            const allocation = Math.min(
              remainingStock,
              Math.floor(Math.random() * remainingStock * 0.8) + 10,
            );
            mockStocks.push({
              warehouse: wh._id,
              material: material._id,
              currentStock: allocation,
            });
            remainingStock -= allocation;
          }
        }
      }
      if (mockStocks.length > 0) {
        stocks = await WarehouseStock.insertMany(mockStocks);
        stocks = await WarehouseStock.find().populate("material");
      }
    }

    const transfers = await WarehouseTransfer.find({
      transferDate: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    const totalWarehouses = warehouses.length;
    const totalStockValue = stocks.reduce(
      (acc, s) => acc + s.currentStock * (s.material?.rateInrUnit || 0),
      0,
    );

    // Check low stock at material level from global stock
    const lowStockMaterials = materials.filter(
      (m) => m.currentStock <= m.reorderLevel,
    ).length;

    const transfersThisMonth = transfers.length;

    res.json({
      totalWarehouses,
      totalStockValue,
      lowStockMaterials,
      transfersThisMonth,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWarehouseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findById(id);
    if (!warehouse)
      return res.status(404).json({ message: "Warehouse not found" });

    const stocks = await WarehouseStock.find({ warehouse: id }).populate(
      "material",
    );

    const materialsInside = stocks.map((s) => ({
      _id: s._id,
      materialName: s.material?.chemicalName || "Unknown",
      currentStock: s.currentStock,
      unit: s.material?.unit || "Kg",
      value: s.currentStock * (s.material?.rateInrUnit || 0),
      status: s.material?.status || "Active",
    }));

    // Chart data
    const stockDistChart = materialsInside.slice(0, 5).map((m) => ({
      name: m.materialName,
      value: m.currentStock,
    }));

    res.json({
      warehouse,
      materialsInside,
      stockDistChart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const transferStock = async (req, res) => {
  try {
    const { fromWarehouse, toWarehouse, material, quantity, remarks } =
      req.body;

    if (fromWarehouse === toWarehouse) {
      return res
        .status(400)
        .json({ message: "Cannot transfer to the same warehouse" });
    }

    const sourceStock = await WarehouseStock.findOne({
      warehouse: fromWarehouse,
      material,
    });
    if (!sourceStock || sourceStock.currentStock < quantity) {
      return res
        .status(400)
        .json({ message: "Insufficient stock in source warehouse" });
    }

    // Deduct from source
    sourceStock.currentStock -= quantity;
    await sourceStock.save();

    // Add to destination
    let destStock = await WarehouseStock.findOne({
      warehouse: toWarehouse,
      material,
    });
    if (!destStock) {
      destStock = new WarehouseStock({
        warehouse: toWarehouse,
        material,
        currentStock: quantity,
      });
    } else {
      destStock.currentStock += quantity;
    }
    await destStock.save();

    // Record transfer
    const transfer = new WarehouseTransfer({
      fromWarehouse,
      toWarehouse,
      material,
      quantity,
      remarks,
    });
    await transfer.save();

    res.json({ success: true, message: "Stock transferred successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
