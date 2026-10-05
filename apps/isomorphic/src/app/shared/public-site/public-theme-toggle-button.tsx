'use client';

import { Moon, Sun } from 'lucide-react';
import type { PublicThemeMode } from './use-public-theme';

type PublicThemeToggleButtonProps = {
  mode: PublicThemeMode;
  onChange: (mode: PublicThemeMode) => void;
  className?: string;
};

export default function PublicThemeToggleButton({
  mode,
  onChange,
  className = '',
}: PublicThemeToggleButtonProps) {
  const isLight = mode === 'light';

  return (
    <button
      type="button"
      onClick={() => onChange(isLight ? 'dark' : 'light')}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition active:scale-[0.98] ${
        isLight
          ? 'border-[#ced7e8] bg-white text-[#23314f] shadow-[0_10px_24px_rgba(15,23,42,0.12)] hover:bg-[#eef3ff]'
          : 'border-white/25 bg-white/5 text-[#e6e8f0] shadow-[0_10px_24px_rgba(0,0,0,0.2)] hover:bg-white/10'
      } ${className}`.trim()}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      title={isLight ? 'Dark theme' : 'Light theme'}
    >
      {isLight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
