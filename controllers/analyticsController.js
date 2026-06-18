import Batch from '../models/Batch.js';
import StageEvent from '../models/StageEvent.js';
import Invoice from '../models/Invoice.js';
import Cost from '../models/Cost.js';
import ChemicalConsumption from '../models/ChemicalConsumption.js';
import UtilityConsumption from '../models/UtilityConsumption.js';
import QualityInspection from '../models/QualityInspection.js';

export const getExecutiveDashboard = async (req, res) => {
  try {
    // 1. Revenue
    const invoices = await Invoice.find({ status: 'Paid' });
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // 2. Production Metres
    const batches = await Batch.find({ status: 'Completed' });
    const totalProductionMetres = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);

    // 3. Costs (Chemicals, Utilities, Others)
    const chemConsumptions = await ChemicalConsumption.find();
    const totalChemCost = chemConsumptions.reduce((sum, c) => sum + (c.cost || 0), 0);

    const utilityConsumptions = await UtilityConsumption.find();
    const totalUtilityCost = utilityConsumptions.reduce((sum, u) => sum + (u.cost || 0), 0);

    // 4. Profit & Margin
    const totalCosts = totalChemCost + totalUtilityCost; // simplified
    const profit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;

    // 5. Active & Delayed Batches
    const activeBatchesCount = await Batch.countDocuments({ status: { $in: ['Running', 'Pending'] } });
    const delayedBatchesCount = await Batch.countDocuments({ status: 'Delayed' });

    // 6. Quality Rejection Percentage
    const inspections = await QualityInspection.find();
    const totalInspected = inspections.length;
    const avgRejectionPercent = totalInspected > 0 
      ? (inspections.reduce((sum, i) => sum + (i.rejectionPercent || 0), 0) / totalInspected).toFixed(2)
      : 0;

    // 7. Process Duration Average
    const stageEvents = await StageEvent.find({ status: 'Completed' });
    const totalDuration = stageEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
    const avgProcessDuration = stageEvents.length > 0 ? (totalDuration / stageEvents.length).toFixed(2) : 0;

    res.json({
      kpis: {
        totalRevenue,
        totalProductionMetres,
        profitMargin,
        activeBatches: activeBatchesCount,
        delayedBatches: delayedBatchesCount,
        avgRejectionPercent,
        utilityCost: totalUtilityCost,
        chemicalCost: totalChemCost,
        avgProcessDuration,
      },
      charts: {
        revenueTrend: [
          { name: 'Jan', value: 4000 },
          { name: 'Feb', value: 3000 },
          { name: 'Mar', value: 2000 },
          { name: 'Apr', value: 2780 },
          { name: 'May', value: totalRevenue || 1890 },
        ],
        productionTrend: [
           { name: 'Jan', value: 1200 },
           { name: 'Feb', value: 2100 },
           { name: 'Mar', value: 800 },
           { name: 'Apr', value: 1600 },
           { name: 'May', value: totalProductionMetres || 900 },
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInventoryIntelligence = async (req, res) => {
  try {
    const { Chemical, ChemicalPurchase, ChemicalConsumption } = await import('mongoose').then(m => m.models);
    
    // Fetch all needed data
    const chemicals = await Chemical.find();
    const purchases = await ChemicalPurchase.find();
    const consumptions = await ChemicalConsumption.find();

    let totalInventoryValue = 0;
    let fastMoving = 0;
    let slowMoving = 0;
    let deadStock = 0;
    let nearReorder = 0;
    let outOfStock = 0;

    const chemicalsWithMetrics = chemicals.map(chem => {
      // Calculate consumed and purchased based on records
      const chemPurchases = purchases.filter(p => p.chemicalName === chem.chemicalName);
      const chemConsumptions = consumptions.filter(c => c.chemicalId === chem.chemicalId || c.chemicalName === chem.chemicalName);
      
      const totalPurchased = chemPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
      const totalConsumed = chemConsumptions.reduce((sum, c) => sum + (c.actualQty || 0), 0);
      
      // We rely on the DB's currentStock, but augment metrics
      const stockValue = (chem.currentStock || 0) * (chem.rateInrUnit || 0);
      totalInventoryValue += stockValue;

      // Statuses
      if (chem.currentStock === 0) outOfStock++;
      else if (chem.currentStock <= (chem.reorderLevel || 0)) nearReorder++;

      // Velocity (simple heuristic: if consumed > 50 in 30 days, fast. If 0, dead)
      if (totalConsumed > 100) fastMoving++;
      else if (totalConsumed > 0 && totalConsumed <= 100) slowMoving++;
      else if (totalConsumed === 0 && chem.currentStock > 0) deadStock++;

      return {
        ...chem.toObject(),
        purchased: totalPurchased,
        consumed: totalConsumed,
        stockValue
      };
    });

    res.json({
      totalInventoryValue,
      fastMoving,
      slowMoving,
      deadStock,
      nearReorder,
      outOfStock,
      chemicals: chemicalsWithMetrics
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
