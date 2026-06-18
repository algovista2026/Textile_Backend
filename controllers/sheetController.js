import { syncSheetToErp } from '../services/googleSheetService.js';
import SheetConfig from '../models/SheetConfig.js';

export const triggerSync = async (req, res) => {
  try {
    let { configId } = req.body;
    if (!configId) {
      const config = await SheetConfig.findOne();
      if (!config) return res.status(400).json({ message: 'No Sheet configuration found. Save a Spreadsheet ID first.' });
      configId = config._id;
    }
    const result = await syncSheetToErp(configId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveConfig = async (req, res) => {
  try {
    const { spreadsheetId, sheetName, mapping, autoSync, syncInterval } = req.body;
    let config = await SheetConfig.findOne();
    
    if (config) {
      config.spreadsheetId = spreadsheetId;
      config.sheetName = sheetName;
      config.mapping = mapping;
      config.autoSync = autoSync;
      config.syncInterval = syncInterval;
      await config.save();
    } else {
      config = await SheetConfig.create(req.body);
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getConfig = async (req, res) => {
  try {
    const config = await SheetConfig.findOne();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
