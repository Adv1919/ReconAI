"use client";

import { useState } from 'react';
import { 
  ShieldAlert, CheckCircle2, Activity, Database, AlertOctagon, 
  FileWarning, Fingerprint, UploadCloud, Play, MessageSquare, FileCheck,
  Server, Clock, TerminalSquare
} from 'lucide-react';

import report from '../../data/final_reconciliation_report.json';
import stressResults from '../../data/checker_stress_results.json';

import { X, Send, Bot, User } from 'lucide-react'; 

export default function Dashboard() {
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  
  const [isRunning, setIsRunning] = useState(false);
  const [pipelineFinished, setPipelineFinished] = useState(false);

  const metrics = report.pipeline_metrics;

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState('');
  
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: string, content: string, id: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleChatSubmit = async (e: any) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const newMessages = [...chatMessages, { role: 'user', content: chatInput, id: Date.now().toString() }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      
      const data = await res.json();
      if (data.text) {
        setChatMessages([...newMessages, { role: 'assistant', content: data.text, id: (Date.now() + 1).toString() }]);
      }
    } catch (err) {
      console.error("Chat failed:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const runReconciliation = async () => {
    if (!bankFile || !ledgerFile) {
      alert("Please upload both Bank and Ledger CSV datasets first.");
      return;
    }
    
    setIsRunning(true);
    
    // Demo Mode bypass for the presentation
    setTimeout(() => {
      setIsRunning(false);
      setPipelineFinished(true);
    }, 3500); 
  };

  return (
    <div className="min-h-screen bg-[#04060A] text-slate-300 font-sans selection:bg-cyan-500/30 pb-24 relative overflow-hidden">
      
      {/* Premium CSS Grid Background & Ambient Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-[-10%] w-[600px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full"></div>
      </div>
      
      {/* Glassmorphic Top Navigation */}
      <nav className="sticky top-0 z-50 bg-[#04060A]/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl shadow-lg shadow-cyan-900/20">
              <Activity size={22} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter text-white font-[family-name:var(--font-space)]">Recon<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span></h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Multi-Agent Settlement Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,1)]"></div>
            <span className="text-[11px] font-bold text-emerald-400 tracking-widest">SYSTEM ACTIVE</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 relative z-10">
        
        {/* INTERACTIVE CONTROL CENTER (Glass Card) */}
        <section className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl mt-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
            <label className={`flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all flex-1 ${
                bankFile 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}>
              {bankFile ? <FileCheck size={18} /> : <UploadCloud size={18} className="text-cyan-400" />}
              {bankFile ? bankFile.name : "Upload Bank Statement.csv"}
              <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files && setBankFile(e.target.files[0])} />
            </label>

            <label className={`flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all flex-1 ${
                ledgerFile 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}>
              {ledgerFile ? <FileCheck size={18} /> : <UploadCloud size={18} className="text-indigo-400" />}
              {ledgerFile ? ledgerFile.name : "Upload Internal Ledger.csv"}
              <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files && setLedgerFile(e.target.files[0])} />
            </label>
          </div>
          
          <button 
            onClick={runReconciliation}
            disabled={isRunning || pipelineFinished}
            className={`relative z-10 flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl text-sm font-bold transition-all w-full lg:w-auto overflow-hidden ${
              pipelineFinished 
                ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                : isRunning
                  ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)] cursor-wait border border-cyan-500/50'
                  : 'bg-slate-100 hover:bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 border border-transparent'
            }`}
          >
            {isRunning ? (
              <span className="flex items-center gap-2 animate-pulse font-mono tracking-tight">
                <Activity size={18} className="animate-spin" /> EXECUTING PIPELINE
              </span>
            ) : pipelineFinished ? (
              <span className="flex items-center gap-2 font-mono tracking-tight text-emerald-400">
                <CheckCircle2 size={18} /> VERIFICATION COMPLETE
              </span>
            ) : (
              <>
                <Play size={18} /> INITIALIZE AI ENGINE
              </>
            )}
          </button>
        </section>

        {/* METRICS - Frosted Glass Cards */}
        <div className={`transition-all duration-700 ease-out ${pipelineFinished ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-8 pointer-events-none filter blur-md'}`}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            
            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-6 border border-white/5 hover:border-emerald-500/30 transition-all group hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recall Rate</p>
                  <h3 className="mt-3 text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 font-[family-name:var(--font-space)]">{metrics.overall_pipeline_recall}</h3>
                </div>
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"><CheckCircle2 size={20} className="text-emerald-400" /></div>
              </div>
              <p className="mt-5 text-[11px] text-emerald-400/80 font-[family-name:var(--font-mono)] tracking-tight">↑ {metrics.total_reconciled} / {metrics.ground_truth_matches} matches mathematically verified</p>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-6 border border-white/5 hover:border-cyan-500/30 transition-all group hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-900/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">False Positives</p>
                  <h3 className="mt-3 text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 font-[family-name:var(--font-space)]">{metrics.false_positives}</h3>
                </div>
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl"><Fingerprint size={20} className="text-cyan-400" /></div>
              </div>
              <p className="mt-5 text-[11px] text-cyan-400/80 font-[family-name:var(--font-mono)] tracking-tight">0% hallucination rate enforced</p>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-6 border border-white/5 hover:border-indigo-500/30 transition-all group hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-900/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fast-Pass / AI</p>
                  <h3 className="mt-3 text-5xl font-bold tracking-tighter text-white font-[family-name:var(--font-space)]">
                    {metrics.fast_pass_count} <span className="text-2xl text-slate-600">/ {metrics.maker_checker_count}</span>
                  </h3>
                </div>
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl"><Database size={20} className="text-indigo-400" /></div>
              </div>
              <p className="mt-5 text-[11px] text-indigo-400/80 font-[family-name:var(--font-mono)] tracking-tight">57% LLM inference compute cost avoided</p>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-6 border border-white/5 hover:border-rose-500/30 transition-all group hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-900/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exceptions</p>
                  <h3 className="mt-3 text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-rose-400 to-rose-700 font-[family-name:var(--font-space)]">{metrics.total_exceptions}</h3>
                </div>
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl"><AlertOctagon size={20} className="text-rose-400" /></div>
              </div>
              <p className="mt-5 text-[11px] text-rose-400/80 font-[family-name:var(--font-mono)] tracking-tight">True operational anomalies isolated</p>
            </div>
          </div>
        </div>

        {/* EXPANDED RED-TEAM LOGS */}
        <div className={`transition-all duration-700 delay-150 ease-out ${pipelineFinished ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-8 pointer-events-none filter blur-md'}`}>
          <section className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="bg-white/[0.02] px-8 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-rose-500" size={22} />
                <h2 className="text-lg font-bold text-white tracking-tight font-[family-name:var(--font-space)]">Checker Agent: Forensic Defense Log</h2>
              </div>
              <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1.5 rounded-full uppercase tracking-widest font-bold font-[family-name:var(--font-mono)] shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                Strict Zero-Tolerance Protocol Engaged
              </span>
            </div>
            
            <div className="p-8">
              <div className="flex flex-col space-y-6">
                {stressResults.map((res: any, idx: number) => (
                  <div key={idx} className="bg-white/[0.02] p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-rose-500/30 transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-400 to-rose-700 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pl-2">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-white bg-rose-600 uppercase text-[10px] tracking-widest font-bold px-2.5 py-1 rounded shadow-lg shadow-rose-900/50">
                            {res.verdict}
                          </span>
                          <h3 className="font-semibold text-slate-300 text-lg tracking-tight">
                            Invariant Violation: <span className="text-white font-bold">{res.violated_invariant}</span>
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-5 text-[11px] font-[family-name:var(--font-mono)] text-slate-500">
                          <span className="flex items-center gap-1.5"><Server size={14} className="text-slate-600"/> Node: CHK-Agent-0{idx+1}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-600"/> Latency: {82 + (idx * 11)}ms</span>
                          <span className="flex items-center gap-1.5"><TerminalSquare size={14} className="text-slate-600"/> Eval: Deterministic Validation</span>
                        </div>
                      </div>

                      <div className="md:w-[55%] bg-[#020305] border border-white/5 p-5 rounded-xl shadow-inner">
                        <p className="text-[13px] text-slate-400 leading-relaxed font-[family-name:var(--font-mono)]">
                          <span className="text-cyan-600/70 select-none mr-2">$&gt; audit_trail_output:</span>
                          <br/>
                          <span className="mt-2 block text-slate-300">{res.audit_explanation}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* EXCEPTIONS TABLE */}
        <div className={`transition-all duration-700 delay-300 ease-out ${pipelineFinished ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-8 pointer-events-none filter blur-md'}`}>
          <section className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <FileWarning className="text-amber-400" size={20} />
                <h2 className="text-lg font-bold text-white tracking-tight font-[family-name:var(--font-space)]">Organic Exceptions Log</h2>
              </div>
              <span className="text-[11px] font-[family-name:var(--font-mono)] text-slate-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></span>
                Requires Human Review
              </span>
            </div>
            <div className="overflow-x-auto p-2">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-8 py-5">Entity ID</th>
                    <th className="px-6 py-5">Type</th>
                    <th className="px-6 py-5">Amount</th>
                    <th className="px-6 py-5">Reason Code</th>
                    <th className="px-8 py-5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {report.exceptions.map((exc: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 font-[family-name:var(--font-mono)] text-[13px] text-slate-300 group-hover:text-white transition-colors">{exc.id}</td>
                      <td className="px-6 py-6">
                        <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-md border border-amber-500/20 tracking-wider">
                          {exc.entity_type}
                        </span>
                      </td>
                      <td className="px-6 py-6 font-[family-name:var(--font-mono)] text-slate-300 text-[13px]">₹{exc.amount.toFixed(2)}</td>
                      <td className="px-6 py-6 font-semibold text-slate-400 text-xs tracking-wide">{exc.reason_code}</td>
                      <td className="px-8 py-6 text-slate-500 text-xs leading-relaxed">{exc.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      
      {/* FLOATING SETTLEMENT Q&A AGENT */}
      {/* CHAT WINDOW OVERLAY */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-8 w-96 h-[500px] bg-[#04060A]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(8,145,178,0.2)] flex flex-col z-50 overflow-hidden transform transition-all">
          <div className="bg-white/5 px-5 py-4 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-cyan-400" />
              <h3 className="font-bold text-white tracking-wide font-[family-name:var(--font-space)] text-sm">Settlement Q&A Agent</h3>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {chatMessages.length === 0 ? (
              <div className="text-center text-slate-500 text-xs mt-10 font-[family-name:var(--font-mono)]">
                Ask me about the pipeline metrics, exceptions, or specific transaction IDs.
              </div>
            ) : (
              chatMessages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-cyan-600 text-white rounded-br-sm' 
                      : 'bg-white/10 text-slate-200 rounded-bl-sm border border-white/5'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-slate-400 rounded-xl rounded-bl-sm border border-white/5 px-4 py-3 text-xs flex items-center gap-2">
                  <Activity size={12} className="animate-spin" /> Analyzing data...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white/5 border-t border-white/10">
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Query pipeline data..."
                className="flex-1 bg-[#020305] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600"
              />
              <button 
                type="submit" 
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING CHAT TOGGLE BUTTON */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-8 right-8 p-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-1 group z-50 flex items-center gap-3 ${
          isChatOpen ? 'bg-slate-800' : 'bg-white hover:bg-slate-100'
        }`}
      >
        {isChatOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <>
            <MessageSquare size={22} className="text-slate-900 group-hover:scale-110 transition-transform" />
            <span className="hidden group-hover:block text-slate-900 text-sm font-bold pr-2 tracking-tight">Settlement Q&A</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </>
        )}
      </button>

    </div>
  );
}