import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Layers, 
  Info, 
  TrendingUp,
  FileCheck,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-sm">Fetching live benchmark metrics & ablation tables...</p>
      </div>
    );
  }

  const {
    text_metrics,
    ablation_study,
    adversarial_retraining,
    transaction_model,
    graph_ring_detection,
    confusion_matrix,
    pr_curve_data,
    system_telemetry,
    honesty_disclosure
  } = metrics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-red-500" />
          <span>Evaluation Metrics & Model Card</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Reproducible scientific benchmarks, multi-stage ablation experiments, adversarial evasion resilience, and dataset disclosures.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel rounded-2xl p-5 border border-gray-800">
          <span className="text-xs uppercase text-gray-400 font-mono block mb-1">Overall F1-Score</span>
          <span className="text-3xl font-extrabold font-mono text-white">
            {(text_metrics.f1_score * 100).toFixed(1)}%
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Precision: {(text_metrics.precision * 100).toFixed(1)}% | Recall: {(text_metrics.recall * 100).toFixed(1)}%</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-gray-800">
          <span className="text-xs uppercase text-gray-400 font-mono block mb-1">PR-AUC Benchmark</span>
          <span className="text-3xl font-extrabold font-mono text-emerald-400">
            {text_metrics.pr_auc.toFixed(3)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">ROC-AUC: {text_metrics.roc_auc.toFixed(3)}</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-gray-800">
          <span className="text-xs uppercase text-gray-400 font-mono block mb-1">Recall @ 1% FPR</span>
          <span className="text-3xl font-extrabold font-mono text-amber-400">
            {(text_metrics.recall_at_1pct_fpr * 100).toFixed(1)}%
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Minimizes false alarms on benign alerts</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase text-gray-400 font-mono">Inference Latency</span>
            {system_telemetry.latency_is_live
              ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Live
                </span>
              : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-700/60 text-gray-400 border border-gray-700 uppercase tracking-wider">
                  Warming up…
                </span>
            }
          </div>
          <span className="text-3xl font-extrabold font-mono text-indigo-400">
            {system_telemetry.p50_latency_ms}ms
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">
            p95: {system_telemetry.p95_latency_ms}ms
            {system_telemetry.latency_is_live && (
              <span className="text-emerald-500/70"> · {system_telemetry.latency_sample_count} samples</span>
            )}
          </span>
        </div>
      </div>

      {/* Ablation Table */}
      <div className="glass-panel rounded-3xl p-6 border border-gray-800 shadow-xl mb-8">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
          <Layers className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Multi-Stage Architectural Ablation Study
            </h3>
            <p className="text-xs text-gray-400">Quantifying the marginal contribution of each pipeline component</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 uppercase font-mono text-[10px]">
                <th className="py-3 px-3">Pipeline Architecture</th>
                <th className="py-3 px-3">Precision</th>
                <th className="py-3 px-3">Recall</th>
                <th className="py-3 px-3">F1-Score</th>
                <th className="py-3 px-3">PR-AUC</th>
                <th className="py-3 px-3 text-right">Inference Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900 font-mono">
              {ablation_study.map((row, idx) => {
                const isWinner = idx === ablation_study.length - 1 || idx === ablation_study.length - 2;
                return (
                  <tr key={idx} className={isWinner ? 'bg-cyan-950/20' : ''}>
                    <td className="py-3.5 px-3 font-sans font-semibold text-white flex items-center gap-2">
                      {isWinner && <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                      <span>{row.tier}</span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-300">{(row.precision * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-gray-300">{(row.recall * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-cyan-400 font-bold">{(row.f1 * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-emerald-400 font-bold">{row.pr_auc.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-right text-gray-400">{row.latency_ms}ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Adversarial Retraining Before / After */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Adversarial Retraining Resilience
                </h3>
                <p className="text-xs text-gray-400">Resistance against obfuscation, homoglyphs & false legalese</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-300 mb-4">
              <strong className="text-rose-400">Attack Methodology: </strong>
              {adversarial_retraining.attack_type} over {adversarial_retraining.test_sample_count} verified scam templates.
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Baseline */}
              <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 text-center">
                <span className="text-[11px] text-gray-400 uppercase font-mono block mb-1">Before Retraining</span>
                <span className="text-2xl font-bold font-mono text-rose-400">
                  {(adversarial_retraining.baseline_model.evasive_recall * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-rose-400 block mt-1">
                  {adversarial_retraining.baseline_model.recall_drop_pct}% Recall Drop
                </span>
              </div>

              {/* Retrained */}
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 text-center">
                <span className="text-[11px] text-cyan-300 uppercase font-mono block mb-1">After Retraining</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {(adversarial_retraining.retrained_model.evasive_recall * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">
                  {adversarial_retraining.retrained_model.recall_recovery_pct}% Robust Recovery
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-gray-500">
            Evaluated on: {adversarial_retraining.held_out_eval_split}
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Confusion Matrix (Held-out Test Corpus)
                </h3>
                <p className="text-xs text-gray-400">Binary scam classification performance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800">
                <span className="text-xs text-gray-400 block">True Negatives (TN)</span>
                <span className="text-2xl font-mono font-bold text-white">
                  {confusion_matrix.matrix[0][0]}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">Legitimate Correctly Cleared</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800">
                <span className="text-xs text-gray-400 block">False Positives (FP)</span>
                <span className="text-2xl font-mono font-bold text-amber-400">
                  {confusion_matrix.matrix[0][1]}
                </span>
                <span className="text-[10px] text-gray-500 block mt-1">Low 1.6% False Alarm Rate</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800">
                <span className="text-xs text-gray-400 block">False Negatives (FN)</span>
                <span className="text-2xl font-mono font-bold text-rose-400">
                  {confusion_matrix.matrix[1][0]}
                </span>
                <span className="text-[10px] text-gray-500 block mt-1">Missed Novel Variations</span>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
                <span className="text-xs text-cyan-300 block">True Positives (TP)</span>
                <span className="text-2xl font-mono font-bold text-cyan-400">
                  {confusion_matrix.matrix[1][1]}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">Scams Neutralized</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-gray-500 flex justify-between">
            <span>Graph Mule Precision: {(graph_ring_detection.mule_precision * 100).toFixed(1)}%</span>
            <span>PaySim PR-AUC: {transaction_model.pr_auc.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* Live System Telemetry Strip */}
      <div className="glass-panel rounded-3xl p-5 border border-cyan-500/20 shadow-xl mb-8">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Live System Telemetry</h3>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            Runtime Computed
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-gray-950 border border-cyan-500/30 text-center">
            <span className="text-[10px] uppercase text-cyan-400 font-mono block mb-1">Active Rules</span>
            <span className="text-2xl font-extrabold font-mono text-white">{system_telemetry.active_rules_count}</span>
            <span className="text-[10px] text-emerald-400 block mt-1.5 font-semibold">&#x25CF; Live &middot; rules.py</span>
          </div>
          <div className="p-4 rounded-2xl bg-gray-950 border border-cyan-500/30 text-center">
            <span className="text-[10px] uppercase text-cyan-400 font-mono block mb-1">KB Chunks Indexed</span>
            <span className="text-2xl font-extrabold font-mono text-white">{system_telemetry.indexed_scam_signatures}</span>
            <span className="text-[10px] text-emerald-400 block mt-1.5 font-semibold">&#x25CF; {system_telemetry.kb_documents_loaded} docs &middot; live scan</span>
          </div>
          <div className="p-4 rounded-2xl bg-gray-950 border border-cyan-500/30 text-center">
            <span className="text-[10px] uppercase text-cyan-400 font-mono block mb-1">p50 Latency</span>
            <span className="text-2xl font-extrabold font-mono text-indigo-400">{system_telemetry.p50_latency_ms}ms</span>
            <span className={`text-[10px] block mt-1.5 font-semibold ${system_telemetry.latency_is_live ? 'text-emerald-400' : 'text-amber-400'}`}>
              {system_telemetry.latency_is_live ? `&#x25CF; ${system_telemetry.latency_sample_count} real samples` : '&#x25CB; Warming up...'}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 text-center">
            <span className="text-[10px] uppercase text-gray-400 font-mono block mb-1">Stream Throughput</span>
            <span className="text-2xl font-extrabold font-mono text-gray-300">{system_telemetry.stream_throughput_tx_per_sec}</span>
            <span className="text-[10px] text-gray-500 block mt-1.5">tx / second</span>
          </div>
        </div>
      </div>

      {/* Scientific Honesty & Limitations Disclosure */}
      <div className="glass-panel rounded-3xl p-6 border border-gray-800 bg-gray-950/80">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs text-gray-300">
            <h4 className="font-bold text-white uppercase tracking-wider">
              Scientific Honesty &amp; Benchmark Limitations
            </h4>
            <p>
              <strong>Data Sources: </strong>
              {honesty_disclosure.datasets_used}
            </p>
            <p>
              <strong>Known Edge Cases: </strong>
              {honesty_disclosure.known_edge_cases}
            </p>
            <p className="text-gray-400 italic">
              {honesty_disclosure.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}