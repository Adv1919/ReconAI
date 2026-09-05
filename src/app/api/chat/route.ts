import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const dataDir = path.join(process.cwd(), 'data');
    let contextData = "";
    
    try {
      contextData = await fs.readFile(path.join(dataDir, 'final_reconciliation_report.json'), 'utf-8');
    } catch (e) {
      contextData = "No pipeline data available yet. The user needs to execute the pipeline first.";
    }

    const systemPrompt = `
      You are the "ReconAI Settlement Q&A Agent", a highly professional FinTech AI assistant.
      Your job is to answer questions about the current financial reconciliation run.
      
      Here is the live data from the most recent pipeline execution (in JSON format):
      ---
      ${contextData}
      ---
      
      Rules:
      1. ONLY answer questions based on the data provided above.
      2. If asked about a specific Bank ID or TXN ID, look it up in the JSON and explain its status.
      3. Keep answers concise, technical, and professional.
    `;

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages,
    });

    return NextResponse.json({ text: result.text });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}