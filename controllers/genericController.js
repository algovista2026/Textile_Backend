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
    
    await createAlert(`${modelName} Added`, `A new ${modelName} entry was created.`, alertType, 'success', req.user ? req.user._id : null);

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
    await createAlert(`${modelName} Updated`, `A ${modelName} entry was updated.`, alertType, 'info', req.user ? req.user._id : null);

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
    await createAlert(`${modelName} Deleted`, `A ${modelName} entry was deleted.`, alertType, 'warning', req.user ? req.user._id : null);

    res.json({
      success: true,
      message: "Document deleted successfully",
      data: deletedData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
