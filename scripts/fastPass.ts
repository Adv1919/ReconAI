import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

// --- Types ---
interface LedgerRecord {
  internal_txn_id: string;
  amount: number;
  customer_name: string;
  created_at: string;
  matched: boolean;
}

interface BankRecord {
  bank_stmt_id: string;
  credit_amount: number;
  narration: string;
  val_date: string;
  matched: boolean;
}

// --- Helpers ---
const parseDate = (dateStr: string) => new Date(dateStr).getTime();

const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');

const dataDir = path.join(process.cwd(), 'data');

// --- 1. Load and Parse Data ---
const ledgerCsv = fs.readFileSync(path.join(dataDir, 'internal_ledger.csv'), 'utf-8');
const bankCsv = fs.readFileSync(path.join(dataDir, 'bank_statement.csv'), 'utf-8');

const ledgers: LedgerRecord[] = parse(ledgerCsv, { columns: true, skip_empty_lines: true }).map((r: any) => ({
  ...r,
  amount: parseFloat(r.amount),
  matched: false
}));

const banks: BankRecord[] = parse(bankCsv, { columns: true, skip_empty_lines: true }).map((r: any) => ({
  ...r,
  credit_amount: parseFloat(r.credit_amount),
  matched: false
}));

// --- 2. The Deterministic Matching Engine ---
const fastPassMatches: any[] = [];
const unresolvedBanks: BankRecord[] = [];

banks.forEach(bank => {
  const bankTime = parseDate(bank.val_date);
  const normalizedNarration = normalizeName(bank.narration);
  const candidates = ledgers.filter(ledger => {
    if (ledger.matched) return false; 
    if (ledger.amount !== bank.credit_amount) return false; 

    const ledgerTime = parseDate(ledger.created_at.split(' ')[0]);
    const dayDifference = (bankTime - ledgerTime) / (1000 * 3600 * 24);
    if (dayDifference < 0 || dayDifference > 2) return false;

    const normalizedLedgerName = normalizeName(ledger.customer_name);
    return normalizedNarration.includes(normalizedLedgerName);
  });

  if (candidates.length === 1) {
    candidates[0].matched = true;
    bank.matched = true;
    fastPassMatches.push({
      bank_id: bank.bank_stmt_id,
      ledger_ids: [candidates[0].internal_txn_id],
      amount: bank.credit_amount,
      confidence: 1.0,
      reason: "Exact 1:1 deterministic match (Amount + Name + Date)"
    });
  } else {
    // If 0 candidates (orphan/fee deducted) OR >1 candidate (adversarial trap), route to LLM
    unresolvedBanks.push(bank);
  }
});

// Extract remaining unresolved ledgers
const unresolvedLedgers = ledgers.filter(l => !l.matched);

// --- 3. Save Outputs ---
fs.writeFileSync(path.join(dataDir, 'fast_pass_matches.json'), JSON.stringify(fastPassMatches, null, 2));
fs.writeFileSync(path.join(dataDir, 'unresolved_banks.json'), JSON.stringify(unresolvedBanks, null, 2));
fs.writeFileSync(path.join(dataDir, 'unresolved_ledgers.json'), JSON.stringify(unresolvedLedgers, null, 2));

// --- 4. Print Metrics ---
console.log("=== Fast-Pass Engine Results ===");
console.log(`Total Bank Records Processed: ${banks.length}`);
console.log(`Auto-Matched Records: ${fastPassMatches.length}`);
console.log(`Unresolved Bank Records (Sent to LLM): ${unresolvedBanks.length}`);
console.log(`Unresolved Ledger Records (Sent to LLM): ${unresolvedLedgers.length}`);