import React from 'react';

export default function RiskGauge({ score = 0, band = 'low', confidence = 0.9 }) {
  // Clamped score
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  // SVG Gauge calculations
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Arc angle (260 degrees arc for speedometer style)
  const arcLength = circumference * 0.72;
  const strokeDashoffset = arcLength - (arcLength * (clampedScore / 100));

  let color = '#10B981'; // Green
  let glowColor = 'rgba(16, 185, 129, 0.3)';
  let label = 'Low Risk';
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  if (band === 'high' || clampedScore >= 65) {
    color = '#EF4444'; // Red
    glowColor = 'rgba(239, 68, 68, 0.4)';
    label = 'High Risk / Scam';
    badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (band === 'suspicious' || clampedScore >= 30) {
    color = '#F59E0B'; // Amber
    glowColor = 'rgba(245, 158, 11, 0.35)';
    label = 'Suspicious';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Glow backdrop */}
        <div 
          className="absolute inset-0 rounded-full blur-xl transition-all duration-700" 
          style={{ background: glowColor }} 
        />

        <svg width={size} height={size} className="transform -rotate-130">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#1F2937"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
            {clampedScore}
          </span>
          <span className="text-xs uppercase tracking-wider text-gray-400 font-medium mt-0.5">
            / 100 Risk
          </span>
        </div>
      </div>

      {/* Band Badge */}
      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${badgeBg}`}>
        <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color }} />
        <span>{label}</span>
      </div>

      <div className="text-[11px] text-gray-500 mt-1">
        Model Confidence: {(confidence * 100).toFixed(0)}%
      </div>
    </div>
  );
}

