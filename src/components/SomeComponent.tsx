import React from 'react';
import { useActions } from '../hooks/useActions';

interface SomeComponentProps {
  itemId: string;
  currentUserId: string;
}

export function SomeComponent({ itemId, currentUserId }: SomeComponentProps) {
  const { performAction, pendingActions, isSyncing } = useActions();

  const handleLike = async () => {
    await performAction({
      type: 'like',
      data: {
        userId: currentUserId,
        targetId: itemId,
        timestamp: new Date().toISOString()
      }
    }, 'like');
  };

  return (
    <div>
      <button 
        onClick={handleLike}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-800"
      >
        Лайк 
        {pendingActions.length > 0 && (
          <span className="text-sm text-slate-400">
            (Ожидает синхронизации)
          </span>
        )}
      </button>
      {isSyncing && (
        <span className="text-sm text-emerald-400 ml-2">
          Синхронизация...
        </span>
      )}
    </div>
  );
} 