const SCENARIOS = [
  { budget: 15, timeLimit: 30 },
  { budget: 100, timeLimit: 10 },
  { budget: 40, timeLimit: 15 }
];

const pipeline = [
  { stage: { id: 'build' }, configId: 'standard', cost: 0, time: 5 },
  { stage: { id: 'unit_test' }, configId: 'sequential', cost: 0, time: 8 },
  { stage: { id: 'sast_scan' }, configId: 'deep', cost: 10, time: 5, risk: 'LOW' },
  { stage: { id: 'staging' }, configId: 'micro', cost: 2, time: 2 },
  { stage: { id: 'production' }, configId: 'rolling', cost: 0, time: 5 }
];

const scenario = SCENARIOS[0];

const totalCost = pipeline.reduce((sum, node) => sum + node.cost, 0);
const totalTime = pipeline.reduce((sum, node) => sum + node.time, 0);

const hasTest = pipeline.some(n => n.stage.id === 'unit_test');
const hasSecurity = pipeline.some(n => n.stage.id === 'sast_scan');
const hasStaging = pipeline.some(n => n.stage.id === 'staging');
const hasApproval = pipeline.some(n => n.stage.id === 'approval');
const hasProd = pipeline.some(n => n.stage.id === 'production');
const prodIndex = pipeline.findIndex(n => n.stage.id === 'production');
const highRiskSecurity = pipeline.some(n => n.stage.id === 'sast_scan' && n.risk === 'HIGH');

console.log("Cost:", totalCost, "Limit:", scenario.budget);
console.log("Time:", totalTime, "Limit:", scenario.timeLimit);

if (totalCost > scenario.budget) console.log("Fail: Budget");
else if (totalTime > scenario.timeLimit) console.log("Fail: Time");
else if (!hasProd) console.log("Fail: No Prod");
else if (!hasTest) console.log("Fail: No Test");
else if (!hasSecurity) console.log("Fail: No Security");
else if (highRiskSecurity) console.log("Fail: High Risk");
else if (!hasStaging && !hasApproval) console.log("Fail: No Staging/Approval");
else if (prodIndex !== pipeline.length - 1) console.log("Fail: Illogical");
else console.log("SUCCESS!");

