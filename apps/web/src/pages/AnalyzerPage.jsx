import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink, 
  HelpCircle, 
  Bot, 
  Layers, 
  RotateCcw, 
  ShieldCheck, 
  BookOpen,
  Search,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import RiskGauge from '../components/RiskGauge';
import TextHighlighter from '../components/TextHighlighter';
import WhyFlaggedDrawer from '../components/WhyFlaggedDrawer';

const PRESET_SAMPLES = [
  {
    label: "SBI KYC Block",
    category: "kyc_block",
    text: "Dear SBI Customer, your YONO account has been suspended due to pending KYC. Click http://bit.ly/sbi-kyc-update immediately to update PAN or your account will be blocked within 24 hours."
  },
  {
    label: "UPI Refund Disguise",
    category: "fake_refund",
    text: "Paytm Refund Alert: Approved refund of Rs 4,999 is pending for your recent failed order. Scan the attached QR code and enter UPI PIN to receive money in bank."
  },
  {
    label: "Power Cutoff Tonight",
    category: "delivery_bill",
    text: "Dear Consumer, your electricity power will be disconnected tonight at 9:30 PM because previous month bill was not updated. Immediately contact Electricity Officer on 9845012345."
  },
  {
    label: "Telegram Task Job",
    category: "job_task",
    text: "Earn Rs 3,000 to Rs 8,000 daily from home! Simple YouTube video liking and Google rating task. No experience required. Join Telegram channel @earn_daily_vip now."
  },
  {
    label: "Obfuscated / Leetspeak",
    category: "adversarial",
    text: "Y0ur B@nk acc0unt is bl0cked. Enter O T P on http://sbi-verify.xyz/login within 12 hrs to unfreeze."
  },
  {
    label: "Benign Salary SMS",
    category: "benign",
    text: "Salary of INR 85,000.00 credited to your A/C XX8472 on 24-Oct-26 by INFOSYS TECH LTD. Available Bal: INR 1,42,850.50."
  }
];

export default function AnalyzerPage() {
  const [inputText, setInputText] = useState(PRESET_SAMPLES[0].text);
  const [useAgent, setUseAgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [whyDrawerOpen, setWhyDrawerOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState('');
  const [showDetailedBox, setShowDetailedBox] = useState(false);

  const handleAnalyze = async (textToAnalyze = inputText) => {
    if (!textToAnalyze.trim()) return;
    setLoading(true);
    setResult(null);
    setFeedbackGiven(null);
    setFeedbackToast('');

    const endpoint = useAgent ? '/api/analyze/agent' : '/api/analyze';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToAnalyze })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (label) => {
    if (!result) return;
    setFeedbackGiven(label);
    setFeedbackToast(`Feedback logged as '${label}'. Added to active learning set.`);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          label: label,
          scam_type: result.scam_types?.[0]?.type || 'unknown',
          comment: 'User rating via Analyzer UI'
        })
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* ── SCAMADVISER HERO SECTION ───────────────────────────────────── */}
      <div className="pt-8 pb-12 sm:pt-12 sm:pb-16 text-center max-w-5xl mx-auto relative">
        
        {/* Large Iconic Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-none mb-6 font-sans">
          Too Good to be True?
          <br />
          <span className="text-red-600 mr-2">/</span>Check Before You Trust.
        </h1>

        {/* Big White Floating Search Pill */}
        <div className="max-w-3xl mx-auto bg-white rounded-full p-2 sm:p-2.5 shadow-2xl shadow-red-950/40 flex items-center gap-3 border border-gray-200 transition-all focus-within:ring-4 focus-within:ring-red-600/30">
          <Search className="w-5 h-5 text-gray-400 ml-3 sm:ml-4 flex-shrink-0" />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Paste SMS alert or message to check..."
            className="w-full bg-transparent text-gray-900 placeholder-gray-500 font-sans text-sm sm:text-base focus:outline-none font-medium truncate"
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !inputText.trim()}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center flex-shrink-0 transition-all shadow-md shadow-red-600/30 disabled:opacity-50"
            title="Scan Now"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Deeper Look Subtext */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-gray-400">
          <span>Need a deeper look?</span>
          <button
            onClick={() => setUseAgent(!useAgent)}
            className="text-white hover:text-red-400 font-bold underline underline-offset-4 flex items-center gap-1.5 transition-colors"
          >
            <Bot className="w-4 h-4 text-red-500" />
            <span>{useAgent ? 'Autonomous Agent Active (5 Tools)' : '👉 Get an Autonomous Agent Scan'}</span>
          </button>
          <span className="text-gray-600">•</span>
          <button
            onClick={() => setShowDetailedBox(!showDetailedBox)}
            className="text-gray-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showDetailedBox ? 'Hide Multiline Editor' : 'Open Multiline Editor'}</span>
          </button>
        </div>

        {/* Quick Benchmark Preset Chips */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-gray-400 font-semibold mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-red-500" /> Test Samples:
          </span>
          {PRESET_SAMPLES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(sample.text);
                handleAnalyze(sample.text);
              }}
              className="px-3 py-1.5 rounded-full bg-[#141419] hover:bg-[#1C1C24] border border-[#262630] text-xs text-gray-300 hover:text-white transition-all shadow-sm"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multiline Editor Box (Collapsible / Expandable) */}
      {showDetailedBox && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-8 animate-in fade-in duration-200 border border-[#23232C]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Full Document / Long Form Message Input
            </span>
            <span className="text-xs font-mono text-gray-500">{inputText.length} characters</span>
          </div>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste complete message, email headers, or long form body..."
            className="w-full bg-[#0C0C10] border border-[#23232C] rounded-xl p-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50 transition-all resize-y"
          />
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => { setInputText(''); setResult(null); }}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !inputText.trim()}
              className="px-6 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Analyze Full Text
            </button>
          </div>
        </div>
      )}

      {/* ── ANALYSIS RESULTS DISPLAY ────────────────────────────────────── */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-500 mt-2">
          
          {/* Main Risk Overview Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Risk Gauge Card */}
            <div className="lg:col-span-4 glass-panel rounded-2xl p-6 flex flex-col items-center justify-between border border-[#23232C]">
              <div className="w-full flex items-center justify-between border-b border-[#23232C] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Trust / Risk Score
                </span>
                <span className="text-[11px] font-mono text-red-400">
                  {result.latency_ms || 38}ms
                </span>
              </div>

              <RiskGauge
                score={result.risk}
                band={result.band}
                confidence={result.confidence || 0.92}
              />

              <div className="w-full pt-3 border-t border-[#23232C] flex items-center justify-between">
                <button
                  onClick={() => setWhyDrawerOpen(true)}
                  className="w-full py-2 px-3 rounded-full bg-[#181820] hover:bg-[#20202A] text-xs font-semibold text-gray-200 border border-[#2D2D38] flex items-center justify-center gap-1.5 transition-all"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>Why Flagged? Deep Dive</span>
                </button>
              </div>
            </div>

            {/* Verdict Summary & Highlighted Content */}
            <div className="lg:col-span-8 glass-panel rounded-2xl p-6 flex flex-col justify-between border border-[#23232C]">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Detection Verdict & Synthesis
                    </span>
                    {result.scam_types && result.scam_types[0] && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-600/10 text-red-400 border border-red-600/30">
                        {result.scam_types[0].display_name} ({(result.scam_types[0].p * 100).toFixed(0)}%)
                      </span>
                    )}
                  </div>

                  {/* Feedback thumbs */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-gray-400 mr-1.5">Helpful?</span>
                    <button
                      onClick={() => handleFeedback('scam')}
                      className={`p-1.5 rounded-lg border transition-all ${
                        feedbackGiven === 'scam'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-[#181820] border-[#2A2A35] text-gray-400 hover:text-white'
                      }`}
                      title="Correct scam flag"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback('benign')}
                      className={`p-1.5 rounded-lg border transition-all ${
                        feedbackGiven === 'benign'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                          : 'bg-[#181820] border-[#2A2A35] text-gray-400 hover:text-white'
                      }`}
                      title="False alarm"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {feedbackToast && (
                  <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300">
                    {feedbackToast}
                  </div>
                )}

                {/* Plain language summary */}
                <p className="text-sm text-gray-200 leading-relaxed p-4 rounded-xl bg-[#0B0B0F] border border-[#23232C] mb-4">
                  {result.summary}
                </p>

                {/* Text Highlighter */}
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Evidence Spans & Highlighted Indicators
                  </div>
                  <TextHighlighter
                    text={inputText}
                    signals={result.signals || []}
                    topTokens={result.top_tokens || []}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sourced Safe Steps & RAG Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safe Steps */}
            <div className="glass-panel rounded-2xl p-6 border border-[#23232C]">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Authoritative Next Steps
                </h3>
              </div>
              <div className="space-y-3">
                {(result.safe_steps || []).map((step, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#0B0B0F] border border-[#23232C] text-xs">
                    <p className="text-gray-200 leading-relaxed mb-2 font-medium">
                      {idx + 1}. {step.text}
                    </p>
                    {step.source && (
                      <a
                        href={step.source}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-mono transition-colors"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Source: {step.source}</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Nearest Vector Matches in Vector Index */}
            <div className="glass-panel rounded-2xl p-6 border border-[#23232C]">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Similar Confirmed Complaints
                </h3>
              </div>
              <div className="space-y-3">
                {(result.similar_known_scams || []).map((sim, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#0B0B0F] border border-[#23232C] text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-red-400 font-semibold uppercase text-[11px]">
                        ID: {sim.id}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800 text-[11px] font-mono">
                        Similarity: {(sim.sim * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-gray-300 italic line-clamp-2">
                      "{sim.text}"
                    </p>
                  </div>
                ))}
                {(!result.similar_known_scams || result.similar_known_scams.length === 0) && (
                  <div className="p-4 text-xs text-gray-500 italic">
                    No high-similarity complaints found in verified index.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Autonomous Agent Trace if enabled */}
          {result.agent_trace && (
            <div className="glass-panel rounded-2xl p-6 border border-red-600/30 shadow-xl shadow-red-950/10">
              <div className="flex items-center justify-between mb-4 border-b border-[#23232C] pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Autonomous Agent Reasoning Trace ('How I Decided')
                  </h3>
                </div>
                <span className="text-xs font-mono text-red-300 px-2 py-0.5 rounded bg-red-950/60 border border-red-800">
                  {result.agent_trace.length} Iterations Capped at 5 Tools
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {result.agent_trace.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#0B0B0F] border border-[#23232C] space-y-1">
                    <div className="flex items-center justify-between text-red-300 font-semibold">
                      <span>Step {step.step}: {step.action || step.tool}</span>
                      {step.args && <span className="text-[10px] text-gray-400">{JSON.stringify(step.args)}</span>}
                    </div>
                    {step.thought && <p className="text-gray-300 font-sans text-xs">Thought: {step.thought}</p>}
                    {step.observation && <p className="text-red-400 text-[11px]">Observation: {step.observation}</p>}
                    {step.verdict && <p className="text-emerald-400 font-bold font-sans">Final Agent Verdict: {step.verdict}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Why Flagged Slide-Over Drawer */}
      <WhyFlaggedDrawer
        isOpen={whyDrawerOpen}
        onClose={() => setWhyDrawerOpen(false)}
        analysis={result}
      />
    </div>
  );
}
