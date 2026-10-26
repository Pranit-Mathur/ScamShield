import React, { useState } from 'react';
import { AlertTriangle, Info, ShieldAlert, Sparkles } from 'lucide-react';

export default function TextHighlighter({ text = '', signals = [], topTokens = [] }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!text) {
    return <div className="text-gray-500 italic text-sm">No content analyzed yet.</div>;
  }

  // 1. Build intervals from deterministic rule signals
  const intervals = [];

  signals.forEach((sig) => {
    (sig.spans || []).forEach(([start, end]) => {
      if (start < text.length && end <= text.length && start < end) {
        intervals.push({
          start,
          end,
          signal: sig,
          type: 'rule'
        });
      }
    });
  });

  // 2. Also map top ML tokens that aren't already covered by rule intervals
  if (topTokens && topTokens.length > 0) {
    topTokens.forEach((t) => {
      if (!t.token || t.token.length < 3) return;
      const regex = new RegExp(`\\b${t.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const mStart = match.index;
        const mEnd = match.index + match[0].length;
        // Check if overlaps with an existing interval
        const overlaps = intervals.some(
          (inv) => Math.max(inv.start, mStart) < Math.min(inv.end, mEnd)
        );
        if (!overlaps) {
          intervals.push({
            start: mStart,
            end: mEnd,
            signal: {
              id: `token_${t.token}`,
              category: 'ML Attribution',
              label: `ML Model Indicator: "${t.token}"`,
              weight: t.importance || 0.15
            },
            type: 'token'
          });
        }
      }
    });
  }

  // Sort intervals by start index
  intervals.sort((a, b) => a.start - b.start);

  // Merge and slice non-overlapping text chunks
  const slices = [];
  let currentIndex = 0;

  for (let i = 0; i < intervals.length; i++) {
    const item = intervals[i];
    if (item.start > currentIndex) {
      slices.push({
        text: text.slice(currentIndex, item.start),
        highlight: false
      });
    }

    if (item.end > currentIndex) {
      const sliceStart = Math.max(currentIndex, item.start);
      slices.push({
        text: text.slice(sliceStart, item.end),
        highlight: true,
        signal: item.signal
      });
      currentIndex = item.end;
    }
  }

  if (currentIndex < text.length) {
    slices.push({
      text: text.slice(currentIndex),
      highlight: false
    });
  }

  const getHighlightColor = (category = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('credential') || cat.includes('malware') || cat.includes('remote')) {
      return 'bg-red-500/20 border-b-2 border-red-500 text-red-200 hover:bg-red-500/35';
    }
    if (cat.includes('urgency') || cat.includes('threat')) {
      return 'bg-amber-500/20 border-b-2 border-amber-500 text-amber-200 hover:bg-amber-500/35';
    }
    if (cat.includes('link') || cat.includes('shortener')) {
      return 'bg-purple-500/20 border-b-2 border-purple-500 text-purple-200 hover:bg-purple-500/35';
    }
    if (cat.includes('ml attribution')) {
      return 'bg-emerald-500/20 border-b-2 border-emerald-500 text-emerald-200 hover:bg-emerald-500/35';
    }
    return 'bg-sky-500/20 border-b-2 border-sky-500 text-sky-200 hover:bg-sky-500/35';
  };

  return (
    <div className="relative">
      <div className="p-4 bg-[#09090D] rounded-xl border border-[#23232C] font-mono text-sm leading-relaxed whitespace-pre-wrap select-text shadow-inner">
        {slices.map((chunk, idx) => {
          if (!chunk.highlight) {
            return <span key={idx} className="text-gray-300">{chunk.text}</span>;
          }

          const sig = chunk.signal;
          const colorClass = getHighlightColor(sig.category);

          return (
            <span
              key={idx}
              className={`relative cursor-pointer transition-all duration-150 px-1 py-0.5 rounded ${colorClass}`}
              onMouseEnter={() => setActiveTooltip(sig)}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={() => setActiveTooltip(activeTooltip === sig ? null : sig)}
            >
              {chunk.text}
            </span>
          );
        })}
      </div>

      {/* Floating Tooltip details */}
      {activeTooltip && (
        <div className="mt-2.5 p-3 rounded-lg bg-gray-900 border border-red-500/40 shadow-xl shadow-red-950/20 animate-in fade-in slide-in-from-top-1 text-xs text-gray-200 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{activeTooltip.label}</span>
              <span className="px-1.5 py-0.5 bg-red-950 text-red-300 rounded border border-red-800 text-[10px] font-mono">
                Threat Impact: +{(activeTooltip.weight * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-gray-400 text-[11px]">{activeTooltip.category}</p>
          </div>
        </div>
      )}

      {/* Evidence Span Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-mono text-gray-400 pt-1">
        <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Indicator Key:</span>
        <span className="flex items-center gap-1.5 text-red-300">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Credentials / Malware
        </span>
        <span className="flex items-center gap-1.5 text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Coercive Urgency
        </span>
        <span className="flex items-center gap-1.5 text-purple-300">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> Suspicious Link
        </span>
        <span className="flex items-center gap-1.5 text-sky-300">
          <span className="w-2 h-2 rounded-full bg-sky-400" /> Impersonation
        </span>
        <span className="flex items-center gap-1.5 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> ML Token
        </span>
      </div>

      {/* High-Impact Keyword Chips */}
      {topTokens && topTokens.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-gray-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-red-400" /> Top ML Attributions:
          </span>
          {topTokens.map((t, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[11px] font-mono text-gray-300"
            >
              <span className="text-red-400 font-medium">"{t.token}"</span> (+{(t.importance * 100).toFixed(0)}%)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

