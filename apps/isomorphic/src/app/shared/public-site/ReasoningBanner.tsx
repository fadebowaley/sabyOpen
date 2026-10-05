'use client';

import { useState } from 'react';
import { Brain, ChevronDown } from 'lucide-react';

export interface ReasoningBannerProps {
  reasoning?: string;
  isStreaming?: boolean;
  isLightTheme?: boolean;
  defaultOpen?: boolean;
  visible?: boolean;
}

export const isThoughtProcessSuppressed = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const explicitlyHidden =
      window.localStorage?.getItem('saby_show_thought_process') === 'false' ||
      window.localStorage?.getItem('saby_hide_thought_process') === 'true';
    if (explicitlyHidden) {
      return true;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('thoughts') === 'false' || params.get('reasoning') === 'false') {
      return true;
    }
  } catch {
    /* localStorage or url params access unavailable */
  }

  return false;
};

export default function ReasoningBanner({
  reasoning,
  isStreaming = false,
  isLightTheme = false,
  defaultOpen = false,
  visible = true,
}: ReasoningBannerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // If explicitly disabled via prop or parameterised configuration, suppress the reasoning banner
  if (!visible || isThoughtProcessSuppressed()) {
    return null;
  }

  const trimmed = (reasoning || '').trim();
  if (!trimmed && !isStreaming) {
    return null;
  }

  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="mb-3 w-full animate-in fade-in-50 duration-200">
      <div
        className={`overflow-hidden rounded-[18px] border transition-all duration-200 ${
          isLightTheme
            ? 'border-indigo-200/90 bg-[#f4f7ff] text-[#1e293b] shadow-sm'
            : 'border-indigo-500/25 bg-[#0f111a]/95 text-indigo-100 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition select-none ${
            isLightTheme
              ? 'hover:bg-indigo-100/60 text-indigo-950'
              : 'hover:bg-indigo-500/10 text-indigo-100'
          }`}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse thought process' : 'Expand thought process'}
        >
          <div className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                isLightTheme
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-indigo-950/80 text-indigo-400'
              }`}
            >
              <Brain
                className={`h-3.5 w-3.5 ${
                  isStreaming ? 'animate-pulse text-indigo-400' : 'text-indigo-400'
                }`}
              />
            </span>
            <span className="font-medium tracking-tight">
              {isStreaming && !trimmed
                ? 'Reasoning & thought process...'
                : 'Thought process'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {trimmed ? (
              <span className="text-[11px] opacity-60">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
            ) : isStreaming ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-indigo-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                Thinking
              </span>
            ) : null}
            <ChevronDown
              className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {isOpen && (
          <div
            className={`border-t px-4 py-3 font-mono text-[12px] leading-relaxed tracking-tight ${
              isLightTheme
                ? 'border-indigo-100/90 bg-white/80 text-slate-700'
                : 'border-indigo-500/15 bg-black/40 text-indigo-200/90'
            }`}
          >
            <div className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words pr-2 selection:bg-indigo-500/30">
              {trimmed || (
                <span className="italic opacity-60">Synthesizing thoughts...</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
