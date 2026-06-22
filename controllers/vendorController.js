import Vendor from '../models/Vendor.js';

export const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: { $ne: 'Deleted' } }).sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVendor = async (req, res) => {
  try {
    const vendorData = { ...req.body };
    vendorData.history = [{ action: 'Created', details: 'Vendor created successfully' }];
    const vendor = await Vendor.create(vendorData);
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    Object.assign(vendor, req.body);
    vendor.history.push({ action: 'Updated', details: 'Vendor details updated' });
    
    await vendor.save();
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    vendor.status = 'Deleted';
    vendor.history.push({ action: 'Deleted', details: 'Vendor deleted from active list' });
    await vendor.save();
    
    res.json({ message: 'Vendor deleted successfully', data: vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
