import mongoose from 'mongoose';

const qualityinspectionSchema = new mongoose.Schema({
  inspectionId: { type: String, unique: true }, batchId: { type: String, required: true }, stageName: String, inspectorId: String, defects: Number, rejectionPercent: Number, severity: String, comments: String
}, { timestamps: true });

const QualityInspection = mongoose.model('QualityInspection', qualityinspectionSchema);
export default QualityInspection;
