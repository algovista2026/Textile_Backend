import { google } from "googleapis";
import SheetConfig from "../models/SheetConfig.js";
import Batch from "../models/Batch.js";
import Client from "../models/Client.js";
import Fabric from "../models/Fabric.js";
import Design from "../models/Design.js";
import Chemical from "../models/Chemical.js";
import Recipe from "../models/Recipe.js";
import Machine from "../models/Machine.js";
import Operator from "../models/Operator.js";
import Cost from "../models/Cost.js";
import StageEvent from "../models/StageEvent.js";
import ChemicalConsumption from "../models/ChemicalConsumption.js";
import QualityInspection from "../models/QualityInspection.js";
import UtilityConsumption from "../models/UtilityConsumption.js";
import Invoice from "../models/Invoice.js";
import ChemicalPurchase from "../models/ChemicalPurchase.js";

// Array for fuzzy matching tab names to Mongoose models
const tabModels = [
  { keyword: "client", model: Client },
  { keyword: "fabric", model: Fabric },
  { keyword: "design", model: Design },
  { keyword: "chemical_consumption", model: ChemicalConsumption },
  { keyword: "chemical", model: Chemical },
  { keyword: "recipe", model: Recipe },
  { keyword: "operator", model: Operator },
  { keyword: "cost", model: Cost },
  { keyword: "batch", model: Batch },
  { keyword: "stage", model: StageEvent },
  { keyword: "quality", model: QualityInspection },
  { keyword: "utility", model: UtilityConsumption },
  { keyword: "invoice", model: Invoice },
  { keyword: "purchase", model: ChemicalPurchase },
];

// Map primary keys for each model for duplicate prevention
const primaryKeyMap = {
  Client: "clientId",
  Fabric: "fabricId",
  Design: "designId",
  Chemical: "chemicalId",
  Recipe: "recipeId",
  Machine: "machineId",
  Operator: "operatorId",
  Cost: "costId",
  Batch: "batchId",
  StageEvent: "eventId",
  ChemicalConsumption: "consumptionId",
  QualityInspection: "inspectionId",
  UtilityConsumption: "utilityId",
  Invoice: "invoiceNo",
  ChemicalPurchase: "purchaseId",
};

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getGoogleSheetsClient = async () => {
  const credentialsPath = path.join(__dirname, '..', 'credentials.json');
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
};

const normalizeHeader = (header) => {
  const clean = header.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return clean.replace(/^_|_$/g, "");
};

// Converts string values into correct types based on Mongoose schema types loosely
const parseValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (!isNaN(value)) return Number(value);
  // Basic date parsing if it matches common date formats
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value);
  return value;
};

export const syncSheetToErp = async (configId) => {
  try {
    const config = await SheetConfig.findById(configId);
    if (!config) throw new Error("Configuration not found");

    const sheets = await getGoogleSheetsClient();

    // Get all sheets in the spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId,
    });
    const sheetTitles = spreadsheet.data.sheets.map((s) => s.properties.title);

    let totalInserted = 0;
    let totalUpdated = 0;
    const syncLogs = [];

    for (const tabName of sheetTitles) {
      const lowerTabName = tabName.toLowerCase();
      let matchedModel = null;

      for (const tm of tabModels) {
        if (lowerTabName.includes(tm.keyword)) {
          matchedModel = tm.model;
          break;
        }
      }

      if (!matchedModel) continue; // Skip unsupported tabs

      const Model = matchedModel;
      const primaryKeyField = primaryKeyMap[Model.modelName];

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: `${tabName}!A1:Z`,
      });

      const rows = response.data.values;
      if (!rows || rows.length < 2) continue; // Skip empty sheets

      const headers = rows[0].map(normalizeHeader);
      const dataRows = rows.slice(1);

      let tabInserted = 0;
      let tabUpdated = 0;
      const bulkOps = [];

      for (const row of dataRows) {
        if (!row || row.length === 0) continue;

        const rowData = {};
        headers.forEach((header, index) => {
          // Automatic camelCase conversion from snake_case header for schema matching
          const camelCaseHeader = header.replace(/_([a-z])/g, (g) =>
            g[1].toUpperCase(),
          );
          rowData[camelCaseHeader] = parseValue(row[index]);
        });

        const primaryKeyValue = rowData[primaryKeyField];

        if (primaryKeyValue) {
          bulkOps.push({
            updateOne: {
              filter: { [primaryKeyField]: primaryKeyValue },
              update: { $set: rowData },
              upsert: true
            }
          });
        }
      }

      if (bulkOps.length > 0) {
        const result = await Model.bulkWrite(bulkOps);
        tabInserted = result.upsertedCount || 0;
        tabUpdated = result.modifiedCount || 0;
        
        // Count inserted vs updated manually if upsertedCount is missing in some driver versions
        if (tabInserted === 0 && tabUpdated === 0 && result.nUpserted !== undefined) {
           tabInserted = result.nUpserted;
           tabUpdated = result.nModified;
        }
      }

      syncLogs.push({
        tab: tabName,
        inserted: tabInserted,
        updated: tabUpdated,
      });
      totalInserted += tabInserted;
      totalUpdated += tabUpdated;
    }

    config.lastSyncTime = new Date();
    await config.save();

    return { success: true, logs: syncLogs, totalInserted, totalUpdated };
  } catch (error) {
    console.error("Google Sheets Sync Error:", error);
    throw error;
  }
};

// --- Bidirectional Sync Helpers (ERP to Google Sheets) ---

const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const appendToGoogleSheet = async (configId, keyword, dataObj) => {
  try {
    const config = await SheetConfig.findById(configId);
    if (!config) throw new Error("Configuration not found");

    const sheets = await getGoogleSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: config.spreadsheetId });
    const sheetTitles = spreadsheet.data.sheets.map(s => s.properties.title);
    
    // Find matching tab
    const tabName = sheetTitles.find(t => t.toLowerCase().includes(keyword.toLowerCase()));
    if (!tabName) throw new Error(`Tab for keyword '${keyword}' not found in Google Sheets`);

    // Fetch headers from row 1
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${tabName}!A1:Z1`,
    });
    
    const headers = headerRes.data.values ? headerRes.data.values[0] : [];
    if (headers.length === 0) return;

    // Construct the row in the exact order of the sheet's headers
    const newRow = headers.map(header => {
      const normalizedHeader = normalizeHeader(header);
      const camelCaseHeader = normalizedHeader.replace(/_([a-z])/g, g => g[1].toUpperCase());
      return dataObj[camelCaseHeader] !== undefined ? dataObj[camelCaseHeader] : "";
    });

    // Append to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: `${tabName}!A:A`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] }
    });

    return true;
  } catch (err) {
    console.error("Error appending to Google Sheet:", err);
    return false;
  }
};

export const updateInGoogleSheet = async (configId, keyword, primaryKeyField, primaryKeyValue, updateData) => {
  try {
    const config = await SheetConfig.findById(configId);
    if (!config) throw new Error("Configuration not found");

    const sheets = await getGoogleSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: config.spreadsheetId });
    const sheetTitles = spreadsheet.data.sheets.map(s => s.properties.title);
    
    const tabName = sheetTitles.find(t => t.toLowerCase().includes(keyword.toLowerCase()));
    if (!tabName) throw new Error(`Tab for keyword '${keyword}' not found in Google Sheets`);

    // Fetch all data to find the row
    const dataRes = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${tabName}!A1:Z`,
    });
    
    const rows = dataRes.data.values || [];
    if (rows.length < 2) return false;

    const headers = rows[0].map(normalizeHeader);
    const primaryKeyIndex = headers.findIndex(h => h.replace(/_([a-z])/g, g => g[1].toUpperCase()) === primaryKeyField);
    
    if (primaryKeyIndex === -1) return false;

    // Find the exact row to update
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && String(row[primaryKeyIndex]) === String(primaryKeyValue));
    
    if (rowIndex === -1) return false;

    // Construct the updated row
    const updatedRow = rows[rowIndex].map((cellValue, idx) => {
      const camelHeader = headers[idx].replace(/_([a-z])/g, g => g[1].toUpperCase());
      return updateData[camelHeader] !== undefined ? updateData[camelHeader] : cellValue;
    });

    // Write back to the exact row range (e.g. Sheet1!A5:Z5)
    // Adding 1 because sheets are 1-indexed
    const range = `${tabName}!A${rowIndex + 1}`; 
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRow] }
    });

    return true;
  } catch (err) {
    console.error("Error updating Google Sheet:", err);
    return false;
  }
};
