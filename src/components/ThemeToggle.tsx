import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`fixed left-1/2 -translate-x-1/2 bottom-[calc(var(--safe-area-bottom)+72px)] p-2 rounded-lg transition-colors z-50 ${
        theme === 'dark' 
          ? 'bg-slate-800/50 hover:bg-slate-800/70 text-yellow-400'
          : 'bg-white/80 hover:bg-white text-slate-600 shadow-sm border border-slate-200/50'
      }`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}