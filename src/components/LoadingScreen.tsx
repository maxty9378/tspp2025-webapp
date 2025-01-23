import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-emerald-primary animate-spin mx-auto" />
        <p className="mt-4 text-slate-400">Загрузка...</p>
      </div>
    </div>
  );
}