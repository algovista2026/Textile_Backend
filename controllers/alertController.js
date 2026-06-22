import Alert from '../models/Alert.js';

export const getAlerts = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).populate('user', 'username email');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    
    if (req.user.role !== 'admin' && alert.user && alert.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to mark this alert as read' });
    }
    
    if (!alert.readBy.includes(req.user._id)) {
      alert.readBy.push(req.user._id);
      await alert.save();
    }
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const alerts = await Alert.find(filter);
    
    for (const alert of alerts) {
      if (!alert.readBy.includes(req.user._id)) {
        alert.readBy.push(req.user._id);
        await alert.save();
      }
    }
    
    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    
    if (req.user.role !== 'admin' && alert.user && alert.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this alert' });
    }
    
    await alert.deleteOne();
    res.json({ message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAlert = async (title, message, type, level, userId = null) => {
  try {
    const alert = new Alert({ title, message, type, level, user: userId });
    await alert.save();
  } catch (error) {
    console.error('Error creating alert:', error);
  }
};
