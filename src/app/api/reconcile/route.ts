import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const bankFile = formData.get('bank') as File;
    const ledgerFile = formData.get('ledger') as File;

    if (!bankFile || !ledgerFile) {
      return NextResponse.json({ success: false, error: "Missing CSV files" }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), 'data');
    const bankBuffer = Buffer.from(await bankFile.arrayBuffer());
    const ledgerBuffer = Buffer.from(await ledgerFile.arrayBuffer());
    
    await fs.writeFile(path.join(dataDir, 'bank_statement.csv'), bankBuffer);
    await fs.writeFile(path.join(dataDir, 'internal_ledger.csv'), ledgerBuffer);

    console.log("✅ New CSV datasets ingested. Starting AI Pipeline...");

    await execPromise('npx tsx scripts/fastPass.ts');
    await execPromise('npx tsx scripts/makerAgent.ts');
    await execPromise('npx tsx scripts/checkerAgent.ts');
    await execPromise('npx tsx scripts/stressTestChecker.ts');
    await execPromise('npx tsx scripts/mergeReport.ts');

    console.log("✅ Pipeline execution complete!");
    return NextResponse.json({ success: true, message: "Pipeline executed successfully" });
    
  } catch (error) {
    console.error("❌ Pipeline failed:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}