'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Brain, Database, Cpu, Bot } from 'lucide-react';

export interface SabyThinkingIndicatorProps {
  stage?: 'thinking' | 'tools' | 'synthesis' | 'routing' | null;
  isLightTheme?: boolean;
  className?: string;
}

const DEFAULT_CYCLE_STEPS = [
  { label: 'Thinking...', icon: Brain, detail: 'Analyzing context & prompt' },
  { label: 'Working...', icon: Activity, detail: 'Processing requirements' },
  { label: 'Consulting data...', icon: Database, detail: 'Verifying organization records' },
  { label: 'Synthesizing response...', icon: Cpu, detail: 'Drafting structured response' },
];

export default function SabyThinkingIndicator({
  stage,
  isLightTheme = false,
  className = '',
}: SabyThinkingIndicatorProps) {
  const [cycleIndex, setCycleIndex] = useState(0);

  // Automatically cycle through natural progression if stage is not explicitly locked
  useEffect(() => {
    if (stage && stage !== 'thinking') return;

    const timer1 = setTimeout(() => setCycleIndex(1), 2400); // -> Working...
    const timer2 = setTimeout(() => setCycleIndex(2), 5200); // -> Consulting data...
    const timer3 = setTimeout(() => setCycleIndex(3), 8500); // -> Synthesizing...

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [stage]);

  let activeLabel = DEFAULT_CYCLE_STEPS[cycleIndex].label;
  let activeDetail = DEFAULT_CYCLE_STEPS[cycleIndex].detail;
  let ActiveIcon = DEFAULT_CYCLE_STEPS[cycleIndex].icon;

  if (stage === 'tools') {
    activeLabel = 'Working with tools & records...';
    activeDetail = 'Executing verified capability';
    ActiveIcon = Database;
  } else if (stage === 'synthesis') {
    activeLabel = 'Synthesizing response...';
    activeDetail = 'Generating final answer';
    ActiveIcon = Cpu;
  } else if (stage === 'routing') {
    activeLabel = 'Routing request...';
    activeDetail = 'Selecting optimal agent engine';
    ActiveIcon = Bot;
  }

  return (
    <div
      className={`relative inline-flex items-center gap-3.5 rounded-2xl border px-4 py-2.5 text-xs font-medium shadow-sm transition-all duration-300 animate-in fade-in-50 ${
        isLightTheme
          ? 'border-[#d2e2fa] bg-gradient-to-r from-[#f5f9ff] via-[#edf4ff] to-[#f7faff] text-[#1c386e] shadow-[0_4px_16px_rgba(28,56,110,0.06)]'
          : 'border-[#2d3f66]/80 bg-gradient-to-r from-[#11192b] via-[#152138] to-[#121c30] text-[#c6dcff] shadow-[0_6px_20px_rgba(0,0,0,0.4)] backdrop-blur-md'
      } ${className}`}
      aria-live="polite"
      role="status"
    >
      {/* Ambient Pulsing Icon */}
      <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]">
        <ActiveIcon className="h-3.5 w-3.5 animate-pulse" />
        <span className="absolute -inset-0.5 rounded-xl bg-blue-500/20 blur-sm animate-ping opacity-60" />
      </div>

      {/* Dynamic Status Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold tracking-wide">
            {activeLabel}
          </span>
          {/* Animated 3-dot harmonic indicator */}
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" />
          </span>
        </div>
        <span
          className={`text-[10.5px] font-normal transition-opacity duration-300 ${
            isLightTheme ? 'text-[#4b6a9b]' : 'text-[#8ba7d6]'
          }`}
        >
          {activeDetail}
        </span>
      </div>
    </div>
  );
}
