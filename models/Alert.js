import mongoose from 'mongoose';

const alertSchema = mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Process', 'Inventory', 'User', 'Warehouse', 'Purchase', 'Consumption', 'Transfer'], 
    required: true 
  },
  level: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'critical'], 
    default: 'info' 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  readBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
}, {
  timestamps: true,
});

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
