import * as fs from 'fs';
import * as path from 'path';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dataDir = path.join(process.cwd(), 'data');

async function runMakerAgent() {
  console.log("Loading unresolved records...");
  const unresolvedBanks = JSON.parse(fs.readFileSync(path.join(dataDir, 'unresolved_banks.json'), 'utf-8'));
  const unresolvedLedgers = JSON.parse(fs.readFileSync(path.join(dataDir, 'unresolved_ledgers.json'), 'utf-8'));

  console.log(`Sending ${unresolvedBanks.length} bank records and ${unresolvedLedgers.length} ledgers to Maker Agent...`);
  console.log("Waiting for LLM response (this may take a moment)...");

  const { object } = await generateObject({
    model: google('gemini-2.5-flash'), 
    temperature: 0.2, 
    system: `You are an elite financial reconciliation Maker Agent. 
    Your job is to match unresolved bank statement records to internal ledger records.
    
    Rules for Matching:
    1. Fuzzy Names: The bank narration may contain truncated names or typos. Match them logically to the ledger.
    2. Fee Deductions: Bank amounts may be exactly 2% lower than the ledger amount due to MDR fees. This is a valid match.
    3. Aggregated Settlements: One bank record might represent the exact mathematical sum of 2 or 3 ledger records. Group them.
    4. Orphans: If a bank record has no logical ledger counterpart, do not force a match.
    5. Traps: If multiple ledgers have the exact same amount and name, pay strict attention to chronological order.

    Do not hallucinate. Output a strict JSON array of your proposed matches.`,
    prompt: `Here are the Bank Records to resolve:\n${JSON.stringify(unresolvedBanks, null, 2)}\n\nHere are the available Ledger Records:\n${JSON.stringify(unresolvedLedgers, null, 2)}`,
    schema: z.object({
      proposed_matches: z.array(
        z.object({
          bank_id: z.string(),
          ledger_ids: z.array(z.string()).describe("Array of 1 or more ledger IDs that match this bank record"),
          confidence: z.number().min(0).max(1).describe("Your confidence from 0.0 to 1.0"),
          reason: z.string().describe("A brief, one-sentence explanation of why this match was made")
        })
      )
    }),
  });

  fs.writeFileSync(path.join(dataDir, 'maker_proposals.json'), JSON.stringify(object.proposed_matches, null, 2));
  
  console.log(`\n=== Maker Agent Complete ===`);
  console.log(`Generated ${object.proposed_matches.length} proposed matches.`);
}

runMakerAgent().catch(console.error);