"use client";

import React, { useEffect, useState } from "react";

export interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export default function ScoreGauge({
  score,
  size = 140,
  strokeWidth = 10,
  showLabel = true,
  className = ""
}: ScoreGaugeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger stroke animation after initial mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const clampedScore = Math.max(0, Math.min(100, Number(score) || 0));

  // Determine fintech tier colors:
  // Emerald (75 - 100), Amber (45 - 74), Rose (0 - 44)
  const isHigh = clampedScore >= 75;
  const isMedium = clampedScore >= 45 && clampedScore < 75;

  const strokeColor = isHigh ? "#059669" : isMedium ? "#d97706" : "#e11d48";
  const glowColor = isHigh
    ? "rgba(5, 150, 105, 0.25)"
    : isMedium
    ? "rgba(217, 119, 6, 0.25)"
    : "rgba(225, 29, 72, 0.25)";
  const levelBadge = isHigh ? "HIGH" : isMedium ? "MED" : "LOW";
  const badgeTextColor = isHigh
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : isMedium
    ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-rose-700 bg-rose-50 border-rose-200";

  // SVG Geometry
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = mounted
    ? circumference - (clampedScore / 100) * circumference
    : circumference;

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label={`Trust Score: ${clampedScore} out of 100`}
      role="progressbar"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] overflow-visible"
      >
        <defs>
          <linearGradient
            id={`gauge-grad-${isHigh ? "high" : isMedium ? "med" : "low"}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={
                isHigh ? "#10b981" : isMedium ? "#fbbf24" : "#f43f5e"
              }
            />
            <stop offset="100%" stopColor={strokeColor} />
          </linearGradient>
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="2.5"
              floodColor={glowColor}
            />
          </filter>
        </defs>

        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Animated dynamic arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#gauge-grad-${isHigh ? "high" : isMedium ? "med" : "low"})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          filter="url(#gauge-glow)"
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
      </svg>

      {/* Center Label */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-3xl font-bold tracking-tight tabular-nums text-slate-900 leading-none">
            {clampedScore.toFixed(clampedScore % 1 === 0 ? 0 : 1)}
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Score / 100
          </span>
          <span
            className={`mt-1 inline-block rounded-full border px-1.5 py-0.2 text-[9px] font-semibold tracking-wide ${badgeTextColor}`}
          >
            {levelBadge}
          </span>
        </div>
      )}
    </div>
  );
}
