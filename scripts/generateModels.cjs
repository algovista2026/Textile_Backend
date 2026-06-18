const fs = require('fs');
const path = require('path');

const models = [
  { name: 'Client', fields: 'clientId: { type: String, unique: true }, name: String, type: String' },
  { name: 'Fabric', fields: 'fabricId: { type: String, unique: true }, name: String, type: String' },
  { name: 'Design', fields: 'designId: { type: String, unique: true }, name: String' },
  { name: 'Chemical', fields: 'chemicalId: { type: String, unique: true }, name: String, unit: String, costPerUnit: Number' },
  { name: 'Recipe', fields: 'recipeId: { type: String, unique: true }, designId: String, chemicals: [{ chemicalId: String, quantity: Number }]' },
  { name: 'Machine', fields: 'machineId: { type: String, unique: true }, name: String, type: String, status: String' },
  { name: 'Operator', fields: 'operatorId: { type: String, unique: true }, name: String, role: String' },
  { name: 'Cost', fields: 'costId: { type: String, unique: true }, type: String, value: Number' },
  { name: 'Batch', fields: 'batchId: { type: String, unique: true, required: true }, clientId: String, fabricId: String, designId: String, quantity: Number, status: String, startDate: Date, endDate: Date' },
  { name: 'StageEvent', fields: 'eventId: { type: String, unique: true }, batchId: { type: String, required: true }, stageName: String, machineId: String, operatorId: String, startTime: Date, endTime: Date, duration: Number, status: String' },
  { name: 'ChemicalConsumption', fields: 'consumptionId: { type: String, unique: true }, batchId: { type: String, required: true }, stageName: String, chemicalId: String, theoreticalQty: Number, actualQty: Number, variance: Number, cost: Number' },
  { name: 'QualityInspection', fields: 'inspectionId: { type: String, unique: true }, batchId: { type: String, required: true }, stageName: String, inspectorId: String, defects: Number, rejectionPercent: Number, severity: String, comments: String' },
  { name: 'UtilityConsumption', fields: 'utilityId: { type: String, unique: true }, batchId: { type: String, required: true }, stageName: String, waterUsage: Number, powerUsage: Number, gasUsage: Number, steamUsage: Number, cost: Number' },
  { name: 'Invoice', fields: 'invoiceId: { type: String, unique: true }, batchId: { type: String, required: true }, clientId: String, amount: Number, status: String, date: Date' }
];

const template = (name, fields) => `import mongoose from 'mongoose';

const ${name.toLowerCase()}Schema = new mongoose.Schema({
  ${fields}
}, { timestamps: true });

const ${name} = mongoose.model('${name}', ${name.toLowerCase()}Schema);
export default ${name};
`;

models.forEach(m => {
  fs.writeFileSync(path.join(__dirname, '..', 'models', `${m.name}.js`), template(m.name, m.fields));
});

console.log('Models generated successfully!');
