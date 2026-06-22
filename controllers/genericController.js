import mongoose from "mongoose";
import SheetConfig from "../models/SheetConfig.js";
import ChemicalPurchase from "../models/ChemicalPurchase.js";
import ChemicalConsumption from "../models/ChemicalConsumption.js";
import Chemical from "../models/Chemical.js";
import {
  appendToGoogleSheet,
  updateInGoogleSheet,
} from "../services/googleSheetService.js";
import { createAlert } from "./alertController.js";

export const getGenericData = async (req, res) => {
  try {
    const { modelName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Model names must be exactly as defined in mongoose (e.g., 'Client', 'Chemical', 'QualityInspection')
    const Model = mongoose.models[modelName];

    if (!Model) {
      return res.status(404).json({ message: `Model ${modelName} not found` });
    }

    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Extract schema paths (columns) for dynamic frontend rendering
    const schemaPaths = Object.keys(Model.schema.paths).filter(
      (path) => !["_id", "__v", "createdAt", "updatedAt"].includes(path),
    );

    let query = {};
    if (search) {
      const searchConditions = schemaPaths
        .filter((path) => Model.schema.paths[path].instance === "String")
        .map((path) => ({ [path]: { $regex: search, $options: "i" } }));

      if (searchConditions.length > 0) {
        query.$or = searchConditions;
      }
    }

    const filterCol = req.query.filterCol;
    const filterVal = req.query.filterVal;

    if (filterCol && filterVal) {
      if (
        Model.schema.paths[filterCol] &&
        Model.schema.paths[filterCol].instance === "String"
      ) {
        query[filterCol] = { $regex: filterVal, $options: "i" };
      } else if (
        Model.schema.paths[filterCol] &&
        Model.schema.paths[filterCol].instance === "Number"
      ) {
        const numVal = Number(filterVal);
        if (!isNaN(numVal)) {
          query[filterCol] = numVal;
        }
      } else {
        query[filterCol] = filterVal;
      }
    }

    const total = await Model.countDocuments(query);
    const data = await Model.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      data,
      columns: schemaPaths,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGenericData = async (req, res) => {
  try {
    const { modelName } = req.params;
    const Model = mongoose.models[modelName];

    if (!Model) {
      return res.status(404).json({ message: `Model ${modelName} not found` });
    }

    const newData = await Model.create(req.body);

    try {
      const config = await SheetConfig.findOne();
      if (config) {
        // Map model names to google sheet keywords
        const keywordMap = {
          ChemicalPurchase: "purchase",
          ChemicalConsumption: "chemical_consumption",
          Chemical: "chemical",
        };
        const keyword = keywordMap[modelName] || modelName;
        await appendToGoogleSheet(config._id, keyword, req.body);
      }
    } catch (sheetErr) {
      console.error("Failed to append to Google Sheet:", sheetErr);
    }
    
    // Add Alert
    let alertType = 'Inventory';
    if(modelName === 'Warehouse') alertType = 'Warehouse';
    else if(modelName === 'ChemicalPurchase') alertType = 'Purchase';
    else if(modelName === 'ChemicalConsumption') alertType = 'Consumption';

    let alertTitle = `${modelName} Added`;
    let alertDesc = `A new ${modelName} entry was created.`;

    if (modelName === 'WarehouseStock') {
       const warehouse = await mongoose.models.Warehouse.findById(newData.warehouse);
       const material = await mongoose.models.Chemical.findById(newData.material);
       const materialName = material ? material.chemicalName : 'Unknown Material';
       const warehouseName = warehouse ? warehouse.warehouseName : 'Unknown Warehouse';
       
       alertTitle = `${materialName} Stock Added`;
       alertDesc = `Stock for ${materialName} was added in ${warehouseName}.`;
       alertType = 'Warehouse';
    } else if (modelName === 'Chemical') {
       alertTitle = `${newData.chemicalName || 'Material'} Added`;
       alertDesc = `${newData.chemicalName || 'A new material'} was added to inventory.`;
       
       if (newData.currentStock === 0) {
          await createAlert(`${newData.chemicalName} Out of Stock`, `${newData.chemicalName} is currently out of stock!`, 'Inventory', 'error', req.user ? req.user._id : null);
       } else if (newData.currentStock <= newData.reorderLevel) {
          await createAlert(`${newData.chemicalName} Low Stock`, `${newData.chemicalName} is running low (Current: ${newData.currentStock} ${newData.unit}).`, 'Inventory', 'warning', req.user ? req.user._id : null);
       }

    } else if (modelName === 'ChemicalPurchase') {
       alertTitle = `Purchase Entry Added`;
       alertDesc = `A new purchase entry for ${newData.chemicalName || 'material'} was recorded.`;
    } else if (modelName === 'ChemicalConsumption') {
       alertTitle = `Consumption Recorded`;
       alertDesc = `Consumption of ${newData.chemicalName || 'material'} was recorded.`;
    } else if (modelName === 'Warehouse') {
       alertTitle = `${newData.warehouseName || 'Warehouse'} Added`;
       alertDesc = `New warehouse ${newData.warehouseName || ''} was created.`;
    }

    await createAlert(alertTitle, alertDesc, alertType, 'success', req.user ? req.user._id : null);

    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateGenericData = async (req, res) => {
  try {
    const { modelName, id } = req.params;
    const Model = mongoose.models[modelName];

    if (!Model) {
      return res.status(404).json({ message: `Model ${modelName} not found` });
    }

    const updatedData = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    try {
      const config = await SheetConfig.findOne();
      if (config) {
        const keywordMap = {
          ChemicalPurchase: "purchase",
          ChemicalConsumption: "chemical_consumption",
          Chemical: "chemical",
        };
        const keyword = keywordMap[modelName] || modelName;

        // Define primary keys based on model
        const primaryKeyMap = {
          ChemicalPurchase: "purchaseId",
          ChemicalConsumption: "consumptionId",
          Chemical: "chemicalId",
        };
        const primaryKeyField = primaryKeyMap[modelName];

        if (primaryKeyField && updatedData[primaryKeyField]) {
          await updateInGoogleSheet(
            config._id,
            keyword,
            primaryKeyField,
            updatedData[primaryKeyField],
            req.body,
          );
        }
      }
    } catch (sheetErr) {
      console.error("Failed to update Google Sheet:", sheetErr);
    }

    let alertType = 'Inventory';
    if(modelName === 'Warehouse') alertType = 'Warehouse';
    else if(modelName === 'ChemicalPurchase') alertType = 'Purchase';
    else if(modelName === 'ChemicalConsumption') alertType = 'Consumption';

    let alertTitle = `${modelName} Updated`;
    let alertDesc = `A ${modelName} entry was updated.`;

    if (modelName === 'WarehouseStock') {
       const warehouse = await mongoose.models.Warehouse.findById(updatedData.warehouse);
       const material = await mongoose.models.Chemical.findById(updatedData.material);
       const materialName = material ? material.chemicalName : 'Unknown Material';
       const warehouseName = warehouse ? warehouse.warehouseName : 'Unknown Warehouse';
       
       alertTitle = `${materialName} Stock Updated`;
       alertDesc = `Stock for ${materialName} was updated in ${warehouseName}.`;
       alertType = 'Warehouse';
    } else if (modelName === 'Chemical') {
       alertTitle = `${updatedData.chemicalName || 'Material'} Updated`;
       alertDesc = `${updatedData.chemicalName || 'Material'} details were updated.`;

       if (updatedData.currentStock === 0) {
          await createAlert(`${updatedData.chemicalName} Out of Stock`, `${updatedData.chemicalName} is currently out of stock!`, 'Inventory', 'error', req.user ? req.user._id : null);
       } else if (updatedData.currentStock <= updatedData.reorderLevel) {
          await createAlert(`${updatedData.chemicalName} Low Stock`, `${updatedData.chemicalName} is running low (Current: ${updatedData.currentStock} ${updatedData.unit}).`, 'Inventory', 'warning', req.user ? req.user._id : null);
       }
    } else if (modelName === 'Warehouse') {
       alertTitle = `${updatedData.warehouseName || 'Warehouse'} Updated`;
       alertDesc = `Warehouse ${updatedData.warehouseName || ''} details were updated.`;
    }

    await createAlert(alertTitle, alertDesc, alertType, 'info', req.user ? req.user._id : null);

    res.json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteGenericData = async (req, res) => {
  try {
    const { modelName, id } = req.params;
    const Model = mongoose.models[modelName];

    if (!Model) {
      return res.status(404).json({ message: `Model ${modelName} not found` });
    }

    const deletedData = await Model.findByIdAndDelete(id);

    if (!deletedData) {
      return res.status(404).json({ message: "Document not found" });
    }

    let alertType = 'Inventory';
    if(modelName === 'Warehouse') alertType = 'Warehouse';
    else if(modelName === 'ChemicalPurchase') alertType = 'Purchase';
    else if(modelName === 'ChemicalConsumption') alertType = 'Consumption';

    let alertTitle = `${modelName} Deleted`;
    let alertDesc = `A ${modelName} entry was deleted.`;

    if (modelName === 'WarehouseStock') {
       const warehouse = await mongoose.models.Warehouse.findById(deletedData.warehouse);
       const material = await mongoose.models.Chemical.findById(deletedData.material);
       const materialName = material ? material.chemicalName : 'Unknown Material';
       const warehouseName = warehouse ? warehouse.warehouseName : 'Unknown Warehouse';
       
       alertTitle = `${materialName} Stock Deleted`;
       alertDesc = `Stock entry for ${materialName} in ${warehouseName} was removed.`;
       alertType = 'Warehouse';
    } else if (modelName === 'Chemical') {
       alertTitle = `${deletedData.chemicalName || 'Material'} Deleted`;
       alertDesc = `${deletedData.chemicalName || 'Material'} was removed from inventory.`;
    } else if (modelName === 'Warehouse') {
       alertTitle = `${deletedData.warehouseName || 'Warehouse'} Deleted`;
       alertDesc = `Warehouse ${deletedData.warehouseName || ''} was removed.`;
    }

    await createAlert(alertTitle, alertDesc, alertType, 'warning', req.user ? req.user._id : null);

    res.json({
      success: true,
      message: "Document deleted successfully",
      data: deletedData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
