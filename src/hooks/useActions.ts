import { useOfflineStorage } from './useOfflineStorage';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';
import { useEffect } from 'react';

export function useActions() {
  const { addPendingAction, syncWithServer, pendingActions, isSyncing } = useOfflineStorage();

  // Функция для выполнения действия
  const performAction = async (data: any, type: string) => {
    // Сохраняем действие локально
    addPendingAction(data, type);

    // Пытаемся синхронизировать с сервером
    const syncFunction = async (actionData: any) => {
      switch (actionData.type) {
        case 'like':
          await supabase.from('likes').insert(actionData.data);
          break;
        case 'comment':
          await supabase.from('comments').insert(actionData.data);
          break;
        // Добавьте другие типы действий
      }
    };

    try {
      await syncWithServer(syncFunction);
      showNotification({
        title: 'Успешно',
        message: 'Действие выполнено',
        type: 'success'
      });
    } catch (error) {
      showNotification({
        title: 'Внимание',
        message: 'Действие сохранено локально и будет синхронизировано позже',
        type: 'warning'
      });
    }
  };

  // Функция для принудительной синхронизации
  const forceSyncWithServer = async () => {
    if (navigator.onLine) {
      try {
        await syncWithServer(async (data) => {
          // Здесь логика синхронизации с сервером
          await supabase.from(data.type).insert(data);
        });
        showNotification({
          title: 'Успешно',
          message: 'Все действия синхронизированы',
          type: 'success'
        });
      } catch (error) {
        showNotification({
          title: 'Ошибка',
          message: 'Не удалось синхронизировать некоторые действия',
          type: 'error'
        });
      }
    }
  };

  // Автоматическая синхронизация при появлении интернета
  useEffect(() => {
    const handleOnline = () => {
      forceSyncWithServer();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return {
    performAction,
    forceSyncWithServer,
    pendingActions,
    isSyncing
  };
} 