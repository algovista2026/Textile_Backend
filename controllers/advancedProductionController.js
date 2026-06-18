import ProductionOrder from '../models/ProductionOrder.js';
import RecipeMaster from '../models/RecipeMaster.js';
import ChemicalConsumption from '../models/ChemicalConsumption.js';
import Chemical from '../models/Chemical.js';

export const getConsumptionAnalytics = async (req, res) => {
  try {
    const { dateRange, department } = req.query;
    
    let consumptions = await ChemicalConsumption.find();
    const chemicals = await Chemical.find();
    
    // We assume ChemicalConsumption has standard structure (chemicalId, quantity, rate)
    // Actually, textile-demo uses ChemicalConsumption with chemicalName, quantity, cost etc.

    if (consumptions.length === 0 && chemicals.length > 0) {
      chemicals.forEach((chem, i) => {
        const qty = Math.floor(Math.random() * 500) + 50;
        
        consumptions.push({
          _id: `mock-${i}`,
          createdAt: new Date(Date.now() - Math.random() * 10000000000),
          batchId: `B-${1000 + i}`,
          chemicalId: chem.chemicalId,
          chemicalName: chem.chemicalName,
          actualQty: qty,
          cost: qty * (chem.rateInrUnit || 150)
        });
      });
    }

    let tableData = consumptions.map(c => ({
      _id: c._id,
      date: c.createdAt,
      batch: c.batchId || 'B-001',
      material: c.chemicalName || c.chemicalId || 'Material',
      department: c.stageName || ['Pretreatment', 'Printing', 'Dyeing', 'Finishing'][Math.floor(Math.random() * 4)],
      plannedQty: c.theoreticalQty || (c.actualQty || 0) * 0.9,
      actualQty: c.actualQty || 0,
      variance: (c.theoreticalQty || ((c.actualQty || 0) * 0.9)) - (c.actualQty || 0),
      cost: c.cost || (c.actualQty || 0) * 150
    }));

    // Apply Filters
    if (department && department !== 'All') {
      tableData = tableData.filter(d => d.department === department);
    }

    if (dateRange && dateRange !== 'All') {
      const now = new Date();
      if (dateRange === 'Today') {
        tableData = tableData.filter(d => new Date(d.date).toDateString() === now.toDateString());
      } else if (dateRange === 'Last7Days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        tableData = tableData.filter(d => new Date(d.date) >= sevenDaysAgo);
      } else if (dateRange === 'ThisMonth') {
        tableData = tableData.filter(d => new Date(d.date).getMonth() === now.getMonth() && new Date(d.date).getFullYear() === now.getFullYear());
      }
    }

    tableData = tableData.sort((a,b) => new Date(b.date) - new Date(a.date));

    // Calculate KPIs based on filtered data
    let totalQty = 0;
    let totalCost = 0;
    const topConsumedMap = {};
    const deptMap = {};

    tableData.forEach(c => {
      totalQty += c.actualQty;
      totalCost += c.cost;
      topConsumedMap[c.material] = (topConsumedMap[c.material] || 0) + c.actualQty;
      deptMap[c.department] = (deptMap[c.department] || 0) + c.actualQty;
    });

    const avgCostPerMeter = tableData.length ? totalCost / (tableData.length * 1000) : 0; 
    const materialEfficiency = tableData.length ? 92.5 : 0; 

    const topConsumedMaterials = Object.keys(topConsumedMap).map(key => ({
      name: key,
      value: topConsumedMap[key]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    const consumptionByDept = Object.keys(deptMap).map(key => ({
      name: key,
      value: deptMap[key]
    }));

    // Trend (Mock Data for Area/Line Chart based on random variations of totalQty)
    const trend = [
      { date: 'Mon', qty: (totalQty / 7) * 0.9, cost: (totalCost / 7) * 0.9 },
      { date: 'Tue', qty: (totalQty / 7) * 1.1, cost: (totalCost / 7) * 1.1 },
      { date: 'Wed', qty: (totalQty / 7) * 1.0, cost: (totalCost / 7) * 1.0 },
      { date: 'Thu', qty: (totalQty / 7) * 1.2, cost: (totalCost / 7) * 1.2 },
      { date: 'Fri', qty: (totalQty / 7) * 1.3, cost: (totalCost / 7) * 1.3 },
      { date: 'Sat', qty: (totalQty / 7) * 0.8, cost: (totalCost / 7) * 0.8 },
      { date: 'Sun', qty: (totalQty / 7) * 0.7, cost: (totalCost / 7) * 0.7 }
    ].map(t => ({...t, qty: Math.round(t.qty || 0), cost: Math.round(t.cost || 0)}));

    res.json({
      totalQty: Math.round(totalQty),
      totalCost: Math.round(totalCost),
      avgCostPerMeter,
      materialEfficiency,
      topConsumedMaterials,
      consumptionByDept,
      trend,
      tableData
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlannedVsActual = async (req, res) => {
  try {
    const chemicals = await Chemical.find().limit(10);
    let recipes = await RecipeMaster.find().populate('material');
    
    // Generate random recipes using real chemicals if none exist
    if (recipes.length === 0 && chemicals.length > 0) {
      recipes = chemicals.map(chem => ({
        _id: chem._id,
        material: chem,
        standardQty: Math.floor(Math.random() * 50) + 10,
        recipeName: `Recipe for ${chem.chemicalName}`,
        processType: 'Printing'
      }));
    }

    // MOCK KPIs
    const plannedConsumption = 5400;
    const actualConsumption = 5620;
    const varianceQty = actualConsumption - plannedConsumption;
    const materialEfficiency = (plannedConsumption / actualConsumption) * 100;

    // Charts - Group by real categories
    const categoryAgg = {};
    chemicals.forEach(c => {
      if(!categoryAgg[c.category]) categoryAgg[c.category] = { planned: 0, actual: 0 };
      const plan = Math.floor(Math.random() * 1000) + 500;
      categoryAgg[c.category].planned += plan;
      categoryAgg[c.category].actual += plan + (Math.random() * 200 - 50);
    });
    
    const comparisonChart = Object.keys(categoryAgg).map(k => ({
      name: k || 'General',
      planned: Math.round(categoryAgg[k].planned),
      actual: Math.round(categoryAgg[k].actual)
    }));


    const varianceTrend = [
      { date: 'Week 1', variance: 15 },
      { date: 'Week 2', variance: -5 },
      { date: 'Week 3', variance: 22 },
      { date: 'Week 4', variance: 8 },
    ];

    const wastageCostTrend = [
      { date: 'Week 1', cost: 1500 },
      { date: 'Week 2', cost: 0 },
      { date: 'Week 3', cost: 2200 },
      { date: 'Week 4', cost: 800 },
    ];

    // Table Data
    const tableData = recipes.map(r => {
      const planned = (r.standardQty || 10) * 10; 
      const actual = planned * (1 + (Math.random() * 0.1 - 0.02)); // +8% to -2%
      const variance = actual - planned;
      const costImpact = variance * (r.material?.rateInrUnit || 100);
      return {
        _id: r._id,
        material: r.material?.chemicalName || r.material?.materialName || 'Unknown',
        planned: planned.toFixed(2),
        actual: actual.toFixed(2),
        variance: variance.toFixed(2),
        variancePercent: ((variance / planned) * 100).toFixed(2),
        costImpact: costImpact.toFixed(2),
        status: variance <= 0 ? 'Within Limit' : (variance < planned * 0.05 ? 'Minor Deviation' : 'High Wastage')
      };
    });

    res.json({
      plannedConsumption,
      actualConsumption,
      varianceQty,
      materialEfficiency,
      comparisonChart,
      varianceTrend,
      wastageCostTrend,
      tableData
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
