import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.join(process.cwd(), 'data');

function scoreMatches(predictionsFile: string) {
  const groundTruth = JSON.parse(fs.readFileSync(path.join(dataDir, 'ground_truth.json'), 'utf-8'));
  
  const truthMap = new Map<string, string[]>();
  
  const ingestTruth = (categoryArray: any[]) => {
    categoryArray.forEach(item => {
      if (item.ledger_ids && item.ledger_ids.length > 0) {
        truthMap.set(item.bank_id, [...item.ledger_ids].sort());
      }
    });
  };

  ingestTruth(groundTruth.exact_1to1);
  ingestTruth(groundTruth.fuzzy_1to1);
  ingestTruth(groundTruth.fee_deducted);
  ingestTruth(groundTruth.adversarial_trap);
  ingestTruth(groundTruth.aggregated_1toN);

  
  const predictionsPath = path.join(dataDir, predictionsFile);
  if (!fs.existsSync(predictionsPath)) {
    console.error(`File not found: ${predictionsFile}`);
    return;
  }
  const predictions = JSON.parse(fs.readFileSync(predictionsPath, 'utf-8'));

  let truePositives = 0;
  let falsePositives = 0;

  predictions.forEach((match: any) => {
    const expectedLedgers = truthMap.get(match.bank_id);

    if (!expectedLedgers) {
      falsePositives++;
      return;
    }

    const predictedLedgers = [...match.ledger_ids].sort();

    if (JSON.stringify(expectedLedgers) === JSON.stringify(predictedLedgers)) {
      truePositives++;
    } else {
      falsePositives++;
    }
  });

  const falseNegatives = truthMap.size - truePositives;

  const precision = truePositives / (truePositives + falsePositives || 1);
  const recall = truePositives / (truthMap.size || 1);

  console.log(`\n=== Accuracy Report: ${predictionsFile} ===`);
  console.log(`Total Possible Matches in Ground Truth: ${truthMap.size}`);
  console.log(`Total Matches Attempted: ${predictions.length}`);
  console.log(`-----------------------------------`);
  console.log(`✅ Correct Matches (True Positives): ${truePositives}`);
  console.log(`❌ Incorrect Matches (False Positives): ${falsePositives}`);
  console.log(`⚠️ Missed Matches (False Negatives): ${falseNegatives}`);
  console.log(`-----------------------------------`);
  console.log(`🎯 Precision: ${(precision * 100).toFixed(2)}% (When it guessed, was it right?)`);
  console.log(`🔍 Recall: ${(recall * 100).toFixed(2)}% (Out of all answers, how many did it find?)`);
}

const targetFile = process.argv[2];

if (!targetFile) {
  console.error("❌ Error: Please provide a filename to score.");
  console.error("Usage: npx tsx scripts/scorer.ts <filename.json>");
  process.exit(1);
}

scoreMatches(targetFile);