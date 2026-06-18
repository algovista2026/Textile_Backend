import mongoose from 'mongoose';

const processSchema = mongoose.Schema({
  lotNo: {
    type: String,
    required: true,
    ref: 'Inward'
  },
  processType: {
    type: String,
    required: true,
    enum: ['Grey Inspection', 'Printing', 'Dyeing', 'Washing', 'Finishing', 'Packing', 'Dispatch']
  },
  status: {
    type: String,
    enum: ['Pending', 'Running', 'Completed'],
    default: 'Pending'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    // Store process specific details like:
    // Printing: { printDesign: String, machine: String, startDate: Date, endDate: Date }
    // Dyeing: { shade: String }
    // Packing: { rollCount: Number, packedBy: String }
  }
}, {
  timestamps: true,
});

const Process = mongoose.model('Process', processSchema);

export default Process;
