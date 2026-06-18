import mongoose from 'mongoose';

const sheetConfigSchema = mongoose.Schema({
  spreadsheetId: { type: String, required: true },
  sheetName: { type: String, default: 'All' },
  autoSync: { type: Boolean, default: false },
  syncInterval: { type: Number, default: 60 }, // in minutes
  lastSyncTime: { type: Date },
  mapping: {
    type: Map,
    of: String // Key: Sheet Header, Value: ERP Field
  }
}, {
  timestamps: true,
});

const SheetConfig = mongoose.model('SheetConfig', sheetConfigSchema);

export default SheetConfig;
