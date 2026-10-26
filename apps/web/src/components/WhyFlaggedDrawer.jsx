import React, { useEffect } from 'react';
import { X, Cpu, ShieldCheck, Link2, AlertCircle, Sparkles, Database, Tag } from 'lucide-react';

export default function WhyFlaggedDrawer({ isOpen, onClose, analysis }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !analysis) return null;

  const {
    risk = 0,
    band = 'low',
    signals = [],
    contributions = [],
    entities = {},
    scam_types = [],
    similar_known_scams = []
  } = analysis;

  const upiList = entities.upi_ids || entities.upis || [];
  const hasEntities = (
    (entities.urls?.length > 0) ||
    (entities.phones?.length > 0) ||
    (upiList.length > 0) ||
    (entities.amounts?.length > 0) ||
    (entities.brands?.length > 0)
  );

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0B0B0F] border-l border-[#23232C] h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 select-text"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#23232C] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-600/10 rounded-xl text-red-500 border border-red-600/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Why Was This Flagged?</h3>
                <p className="text-xs text-gray-400">Stacker calibration & multi-signal attribution breakdown</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#181820] border border-transparent hover:border-[#23232C] transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Calibrated Risk Band Banner */}
          <div className="p-4 rounded-2xl bg-[#07070A] border border-[#23232C] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider">Calibrated Threat Score</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black font-mono text-white">{risk}</span>
                <span className="text-xs text-gray-500 font-mono">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider">Verdict Band</span>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono ${
                band === 'high' 
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                  : band === 'suspicious' 
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {band} Band
              </span>
            </div>
          </div>

          {/* Primary Scam Type */}
          {scam_types && scam_types[0] && (
            <div className="p-3 rounded-xl bg-[#07070A] border border-[#23232C] flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-red-500" /> Primary Pattern Category:
              </span>
              <span className="font-bold text-white uppercase tracking-wider font-mono">
                {scam_types[0].display_name} ({(scam_types[0].p * 100).toFixed(0)}%)
              </span>
            </div>
          )}

          {/* Section 1: Stacked Signal Weights */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Multi-Layer Risk Feature Contributions ({contributions.length})</span>
            </h4>
            <div className="space-y-2">
              {contributions.map((c, idx) => {
                const signalVal = c.value ?? 0;
                const weightVal = c.weight ?? 0;
                const isHigh = signalVal >= 65;
                const isMed = signalVal >= 30;

                return (
                  <div key={idx} className="p-3 rounded-xl bg-[#07070A] border border-[#23232C] text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-gray-200 font-semibold">{c.name}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[10px] text-gray-500">Weight: {weightVal}%</span>
                        <span className={`font-bold text-xs ${
                          isHigh ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-gray-400'
                        }`}>
                          {signalVal}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-[#181820] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHigh ? 'bg-red-500' : isMed ? 'bg-amber-500' : 'bg-gray-600'
                        }`} 
                        style={{ width: `${Math.min(100, Math.max(3, signalVal))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Rule Triggers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Deterministic Rule Triggers ({signals.length})</span>
            </h4>
            {signals.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3 rounded-xl bg-[#07070A] border border-[#23232C]">
                No deterministic rules tripped for this content.
              </p>
            ) : (
              <div className="space-y-2">
                {signals.map((sig, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-red-300">{sig.label}</span>
                      <span className="text-red-400 font-mono text-[11px] font-bold">
                        Weight: {(sig.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-gray-400 text-[11px]">{sig.category}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Semantic Matches with Known Scam Database */}
          {similar_known_scams && similar_known_scams.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-red-400" />
                <span>Vector Database Similarity Matches ({similar_known_scams.length})</span>
              </h4>
              <div className="space-y-2">
                {similar_known_scams.map((scam, idx) => {
                  const simPct = Math.round((scam.sim || 0) * 100);
                  const isHighSim = simPct >= 70;
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-[#07070A] border border-[#23232C] text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 font-bold uppercase tracking-wider text-[10px] font-mono">
                          {scam.type?.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          isHighSim 
                            ? 'bg-red-950 text-red-400 border border-red-800' 
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {simPct}% Cosine Match
                        </span>
                      </div>
                      <p className="text-gray-400 text-[11px] line-clamp-2 italic font-mono">
                        "{scam.text}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: Extracted Entities */}
          {hasEntities && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Extracted Entities & Digital Artifacts</span>
              </h4>
              <div className="p-3 rounded-xl bg-[#07070A] border border-[#23232C] text-xs space-y-2 font-mono">
                {entities.urls?.length > 0 && (
                  <div>
                    <span className="text-gray-500">URLs: </span> 
                    <span className="text-purple-300 break-all">{entities.urls.join(', ')}</span>
                  </div>
                )}
                {upiList.length > 0 && (
                  <div>
                    <span className="text-gray-500">UPI IDs: </span> 
                    <span className="text-emerald-300">{upiList.join(', ')}</span>
                  </div>
                )}
                {entities.phones?.length > 0 && (
                  <div>
                    <span className="text-gray-500">Phones: </span> 
                    <span className="text-sky-300">{entities.phones.join(', ')}</span>
                  </div>
                )}
                {entities.amounts?.length > 0 && (
                  <div>
                    <span className="text-gray-500">Amounts: </span> 
                    <span className="text-amber-300">{entities.amounts.join(', ')}</span>
                  </div>
                )}
                {entities.brands?.length > 0 && (
                  <div>
                    <span className="text-gray-500">Targeted Brands: </span> 
                    <span className="text-red-400 capitalize">{entities.brands.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 mt-6 border-t border-[#23232C] text-center text-xs text-gray-500 font-mono">
          ScamShield Explainable Pipeline v2.0 • GBDT + Stacker Calibration
        </div>
      </div>
    </div>
  );
}
