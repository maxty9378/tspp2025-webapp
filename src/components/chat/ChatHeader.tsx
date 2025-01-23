import React from 'react';
import { MessageSquare } from 'lucide-react';

interface ChatHeaderProps {
  messageCount: number;
  loading: boolean;
}

export function ChatHeader({ messageCount, loading }: ChatHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-lg border-b border-slate-700/30">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-emerald-primary" />
          </div>
          <div>
            <h1 className="font-medium text-emerald-light">Общий чат</h1>
            <p className="text-sm text-slate-400">
              {loading ? 'Загрузка...' : `${messageCount} сообщений`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}