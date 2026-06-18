import mongoose from 'mongoose';

const inwardSchema = mongoose.Schema({
  transportLrNumber: { type: String, required: true },
  bell: { type: Number },
  piece: { type: Number },
  bellNo: { type: String },
  aavakMeter: { type: Number, required: true },
  lotNo: { type: String, required: true, unique: true },
  vajan: { type: Number },
  swikaryaMeter: { type: Number },
  shortage: { type: Number },
  goodReturns: { type: Number },
  mokalnar: { type: String },
  station: { type: String },
  aavakTarikh: { type: Date, required: true },
  quality: { type: String },
  fold: { type: String },
  firm: { type: String },
  transportBillNo: { type: String },
  remarks: { type: String },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Processing', 'Completed'] }
}, {
  timestamps: true,
});

const Inward = mongoose.model('Inward', inwardSchema);

export default Inward;
