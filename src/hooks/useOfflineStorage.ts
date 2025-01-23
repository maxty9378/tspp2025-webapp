import { useState, useEffect } from 'react';

interface OfflineData {
  timestamp: number;
  data: any;
  type: string;
  status: 'pending' | 'synced';
}

export function useOfflineStorage() {
  const [pendingActions, setPendingActions] = useState<OfflineData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Загрузка сохраненных действий при инициализации
  useEffect(() => {
    const stored = localStorage.getItem('pendingActions');
    if (stored) {
      setPendingActions(JSON.parse(stored));
    }
  }, []);

  // Сохранение действий в localStorage при изменении
  useEffect(() => {
    if (pendingActions.length > 0) {
      localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
    } else {
      localStorage.removeItem('pendingActions');
    }
  }, [pendingActions]);

  const addPendingAction = (data: any, type: string) => {
    const action: OfflineData = {
      timestamp: Date.now(),
      data,
      type,
      status: 'pending'
    };
    setPendingActions(prev => [...prev, action]);
  };

  const syncWithServer = async (syncFunction: (data: any) => Promise<void>) => {
    if (isSyncing || pendingActions.length === 0) return;

    setIsSyncing(true);
    try {
      // Синхронизируем каждое действие по очереди
      for (const action of pendingActions) {
        if (action.status === 'pending') {
          await syncFunction(action.data);
          // Помечаем действие как синхронизированное
          setPendingActions(prev => 
            prev.map(a => 
              a.timestamp === action.timestamp 
                ? { ...a, status: 'synced' }
                : a
            )
          );
        }
      }
      // Удаляем синхронизированные действия
      setPendingActions(prev => prev.filter(a => a.status === 'pending'));
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    addPendingAction,
    syncWithServer,
    pendingActions,
    isSyncing
  };
} 