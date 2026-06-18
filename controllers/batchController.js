import Batch from '../models/Batch.js';

export const getBatches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.$or = [
        { batchId: { $regex: search, $options: 'i' } },
        { fabricId: { $regex: search, $options: 'i' } },
        { clientId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Batch.countDocuments(query);
    const batches = await Batch.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      batches,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
