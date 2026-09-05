import * as fs from 'fs';
import * as path from 'path';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';

dotenv.config({ path: '.env.local' });
const dataDir = path.join(process.cwd(), 'data');

async function runCheckerStressTest() {
  console.log("Running Adversarial Stress Test on Checker Agent...");

  const ledgerCsv = fs.readFileSync(path.join(dataDir, 'internal_ledger.csv'), 'utf-8');
  const bankCsv = fs.readFileSync(path.join(dataDir, 'bank_statement.csv'), 'utf-8');
  const ledgers = parse(ledgerCsv, { columns: true, skip_empty_lines: true });
  const banks = parse(bankCsv, { columns: true, skip_empty_lines: true });

  const ledgerMap = new Map(ledgers.map((l: any) => [l.internal_txn_id, l]));
  const bankMap = new Map(banks.map((b: any) => [b.bank_stmt_id, b]));

  // Planted adversarial mutations
  const adversarialProposals = [
    {
      label: "MATH_TAMPER",
      proposal: {
        bank_id: "BNK_5050",
        ledger_ids: ["TXN_1050"],
        confidence: 0.99,
        reason: "Matched on customer name"
      },
      // Tampering bank record credit amount to cause an unexplained mismatch
      bankRecord: { ...bankMap.get("BNK_5050"), credit_amount: "11000.00" },
      matchedLedgers: [ledgerMap.get("TXN_1050")]
    },
    {
      label: "DATE_TAMPER",
      proposal: {
        bank_id: "BNK_5051",
        ledger_ids: ["TXN_1051"],
        confidence: 0.95,
        reason: "Matched on customer name"
      },
      // Tampering valuation date to 15 days later
      bankRecord: { ...bankMap.get("BNK_5051"), val_date: "2026-09-05" },
      matchedLedgers: [ledgerMap.get("TXN_1051")]
    },
    {
      label: "COLLISION_DOUBLE_SPEND",
      proposal: {
        bank_id: "BNK_5052",
        ledger_ids: ["TXN_1050"], // Re-using TXN_1050 already assigned to BNK_5050
        confidence: 0.85,
        reason: "Partial name overlap"
      },
      bankRecord: bankMap.get("BNK_5052"),
      matchedLedgers: [ledgerMap.get("TXN_1050")]
    }
  ];

  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    temperature: 0.0,
    system: `You are a strict, skeptical Senior Financial Auditor (Checker Agent) for Razorpay.
    Verify proposals strictly against financial invariants:
    1. Math: Exact match or valid 2% MDR fee deduction. Any other difference is REJECTED.
    2. Date: Settlement within 0-4 days. Exceeding 4 days is REJECTED.
    3. Duplication/Collision: Re-assigning previously claimed transactions is REJECTED.
    Issue REJECTED if any invariant fails.`,
    prompt: `Audit these proposals:\n${JSON.stringify(adversarialProposals, null, 2)}`,
    schema: z.object({
      audit_results: z.array(
        z.object({
          bank_id: z.string(),
          verdict: z.enum(['APPROVED', 'REJECTED', 'FLAGGED_FOR_HUMAN']),
          violated_invariant: z.string().optional(),
          audit_explanation: z.string()
        })
      )
    })
  });

  fs.writeFileSync(path.join(dataDir, 'checker_stress_results.json'), JSON.stringify(object.audit_results, null, 2));

  console.log("\n=== Stress Test Results ===");
  object.audit_results.forEach((res, i) => {
    console.log(`Test Case ${i + 1} [${adversarialProposals[i].label}]: Verdict = ${res.verdict} | ${res.audit_explanation}`);
  });
}

runCheckerStressTest().catch(console.error);