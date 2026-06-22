import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  vendorName: { type: String, required: true },
  address: { type: String },
  mobileNo: { type: String, required: true },
  companyName: { type: String, required: true },
  email: { type: String },
  remarks: { type: String },
  materialName: { type: String },
  status: { type: String, enum: ['Active', 'Deleted'], default: 'Active' },
  history: [
    {
      action: { type: String },
      date: { type: Date, default: Date.now },
      details: { type: String }
    }
  ]
}, { timestamps: true });

export default mongoose.model('Vendor', vendorSchema);
