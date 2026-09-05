import * as fs from 'fs';
import * as path from 'path';

const formatDate = (date: Date): string => date.toISOString().split('T')[0];
const formatDateTime = (date: Date): string => date.toISOString().replace('T', ' ').substring(0, 19);

const ledgerRecords: string[] = ['internal_txn_id,amount,customer_name,created_at'];
const bankRecords: string[] = ['bank_stmt_id,credit_amount,narration,val_date'];
const groundTruth: Record<string, any[]> = { 
  exact_1to1: [], 
  fuzzy_1to1: [],
  fee_deducted: [],
  adversarial_trap: [],
  aggregated_1toN: [], 
  orphan_bank: [],
  orphan_ledger: []
};

const baseDate = new Date('2026-08-20T10:00:00Z');
const firstNames = ["Aarav", "Priya", "Rahul", "Sneha", "Vikram", "Ananya"];
const lastNames = ["Sharma", "Verma", "Patel", "Gupta", "Mehta", "Singh"];

let txnCounter = 1000;
let bankCounter = 5000;

const randomFloat = (min: number, max: number) => +(Math.random() * (max - min) + min).toFixed(2);
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86400000);

// 1. Exact Matches (Fixed: No TXN_ID in narration)
for (let i = 0; i < 40; i++) {
  const txnId = `TXN_${txnCounter++}`; const bankId = `BNK_${bankCounter++}`; const amount = randomFloat(150, 8500);
  const name = `${randomElement(firstNames)} ${randomElement(lastNames)}`; const txnTime = addMinutes(baseDate, randomInt(10, 1440));
  ledgerRecords.push(`${txnId},${amount},${name},${formatDateTime(txnTime)}`);
  bankRecords.push(`${bankId},${amount},UPI/RZP/${name.toUpperCase()}/REF${randomInt(10000, 99999)},${formatDate(addDays(txnTime, randomElement([0, 1])))}`);
  groundTruth.exact_1to1.push({ bank_id: bankId, ledger_ids: [txnId], amount });
}

// 2. Fuzzy Matches (Kept strong)
for (let i = 0; i < 15; i++) {
  const txnId = `TXN_${txnCounter++}`; const bankId = `BNK_${bankCounter++}`; const amount = randomFloat(500, 15000);
  const cleanName = `${randomElement(firstNames)} ${randomElement(lastNames)}`; const txnTime = addMinutes(baseDate, randomInt(10, 2880));
  ledgerRecords.push(`${txnId},${amount},${cleanName},${formatDateTime(txnTime)}`);
  bankRecords.push(`${bankId},${amount},NEFT-INW/${cleanName.substring(0, 4).toUpperCase()}-SETTLMT,${formatDate(addDays(txnTime, randomInt(2, 4)))}`);
  groundTruth.fuzzy_1to1.push({ bank_id: bankId, ledger_ids: [txnId], amount });
}

// 3. Fee Deductions (New: 2% MDR tolerance check)
for (let i = 0; i < 5; i++) {
  const txnId = `TXN_${txnCounter++}`; const bankId = `BNK_${bankCounter++}`; 
  const amount = randomFloat(1000, 5000);
  const bankAmount = +(amount * 0.98).toFixed(2); 
  const name = `${randomElement(firstNames)} ${randomElement(lastNames)}`; const txnTime = addMinutes(baseDate, randomInt(10, 1440));
  
  ledgerRecords.push(`${txnId},${amount},${name},${formatDateTime(txnTime)}`);
  bankRecords.push(`${bankId},${bankAmount},CC/RZP/${name.toUpperCase()}/NET,${formatDate(addDays(txnTime, 1))}`);
  groundTruth.fee_deducted.push({ bank_id: bankId, ledger_ids: [txnId], ledger_amount: amount, bank_amount: bankAmount, note: "2% MDR deducted" });
}

// 4. Adversarial Traps (New: Fool the naive matchers)
const trapDate1 = addMinutes(baseDate, 300);
const tId1 = `TXN_${txnCounter++}`; const bId1 = `BNK_${bankCounter++}`;
const tId2 = `TXN_${txnCounter++}`; const bId2 = `BNK_${bankCounter++}`;
ledgerRecords.push(`${tId1},5000.00,Rahul Gupta,${formatDateTime(trapDate1)}`);
ledgerRecords.push(`${tId2},5010.00,Rahul Gupta,${formatDateTime(addMinutes(trapDate1, 120))}`);
bankRecords.push(`${bId1},5000.00,NEFT-INW/RAHU-SETTLMT,${formatDate(addDays(trapDate1, 1))}`);
bankRecords.push(`${bId2},5010.00,NEFT-INW/RAHU-SETTLMT,${formatDate(addDays(trapDate1, 1))}`);
groundTruth.adversarial_trap.push({ bank_id: bId1, ledger_ids: [tId1], amount: 5000.00 });
groundTruth.adversarial_trap.push({ bank_id: bId2, ledger_ids: [tId2], amount: 5010.00 });

const trapDate2 = addMinutes(baseDate, 1400);
const tId3 = `TXN_${txnCounter++}`; const bId3 = `BNK_${bankCounter++}`;
const tId4 = `TXN_${txnCounter++}`; const bId4 = `BNK_${bankCounter++}`;
ledgerRecords.push(`${tId3},2500.50,Priya Patel,${formatDateTime(trapDate2)}`);
ledgerRecords.push(`${tId4},2500.50,Priya Patel,${formatDateTime(addMinutes(trapDate2, 300))}`); 
bankRecords.push(`${bId3},2500.50,UPI/RZP/PRIYA PATEL/REF11,${formatDate(addDays(trapDate2, 1))}`);
bankRecords.push(`${bId4},2500.50,UPI/RZP/PRIYA PATEL/REF22,${formatDate(addDays(trapDate2, 1))}`); 
groundTruth.adversarial_trap.push({ bank_id: bId3, ledger_ids: [tId3], amount: 2500.50 });
groundTruth.adversarial_trap.push({ bank_id: bId4, ledger_ids: [tId4], amount: 2500.50 });

// 5. Aggregated Settlements (1:N)
for (let i = 0; i < 5; i++) {
  const bankId = `BNK_${bankCounter++}`; let bundleAmount = 0.0; const bundledIds: string[] = [];
  for (let j = 0; j < 3; j++) {
    const tId = `TXN_${txnCounter++}`; const subAmt = randomFloat(300, 2000); bundleAmount += subAmt; bundledIds.push(tId);
    ledgerRecords.push(`${tId},${subAmt},Aggregated Batch,${formatDateTime(baseDate)}`);
  }
  bundleAmount = +(bundleAmount.toFixed(2));
  bankRecords.push(`${bankId},${bundleAmount},NODAL-BATCH-SETTLE-CNT-3,${formatDate(addDays(baseDate, 1))}`);
  groundTruth.aggregated_1toN.push({ bank_id: bankId, ledger_ids: bundledIds, amount: bundleAmount });
}

// 6. True Exceptions (Orphans)
const orphanBankId = `BNK_${bankCounter++}`;
bankRecords.push(`${orphanBankId},999.99,UNKNOWN-DEPOSIT,${formatDate(baseDate)}`);
groundTruth.orphan_bank.push({ bank_id: orphanBankId, ledger_ids: [], reason: "No ledger match" });

const orphanTxn1 = `TXN_${txnCounter++}`;
const orphanTxn2 = `TXN_${txnCounter++}`;
ledgerRecords.push(`${orphanTxn1},1250.00,Amit Singh,${formatDateTime(baseDate)}`);
ledgerRecords.push(`${orphanTxn2},3400.00,Neha Rao,${formatDateTime(baseDate)}`);
groundTruth.orphan_ledger.push({ ledger_id: orphanTxn1, reason: "Never hit bank" });
groundTruth.orphan_ledger.push({ ledger_id: orphanTxn2, reason: "Never hit bank" });

const dataDir = path.join(process.cwd(), 'data');
fs.writeFileSync(path.join(dataDir, 'internal_ledger.csv'), ledgerRecords.join('\n'));
fs.writeFileSync(path.join(dataDir, 'bank_statement.csv'), bankRecords.join('\n'));
fs.writeFileSync(path.join(dataDir, 'ground_truth.json'), JSON.stringify(groundTruth, null, 2));

console.log("Day 1 Complete (V2): Generated enhanced synthetic data with traps and fee tolerances.");