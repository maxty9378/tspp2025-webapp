import React, { useState } from 'react';
import { Users, Activity, MessageSquare, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendMessageToGroup } from '../lib/telegramBot';
import { AOSManagement } from './admin/AOSManagement'; 
import { TasksManagement } from './admin/TasksManagement';
import { showNotification } from '../utils/notifications';

export function AdminPanel() {
  const [isResetting, setIsResetting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const adminIds = ['5810535171', '283397879'];
  const isAdmin = Boolean(
    tgUser && adminIds.includes(tgUser.id.toString()) || 
    (localStorage.getItem('admin_auth') === 'true' && localStorage.getItem('adminUsername') === '@kadochkindesign')
  );

  if (!isAdmin) {
    return null;
  }

  const handleSendTestMessage = async () => {
    setIsSendingMessage(true);
    try {
      const testMessage = customMessage || `🤖 Тестовое сообщение из админ-панели\n\n⏰ ${new Date().toLocaleString('ru-RU')}`;
      const result = await sendMessageToGroup(testMessage, 'admin');
      
      if (result) {
        setCustomMessage('');
        const tg = window.Telegram?.WebApp;
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.notificationOccurred('success');
        }
      }
    } catch (error) {
      console.error('Error sending test message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleResetAllUsers = async () => {
    if (!window.confirm('Вы уверены? Это действие сбросит ВСЕ данные пользователей и не может быть отменено!')) {
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .neq('id', tgUser?.id.toString());

      if (error) throw error;

      showNotification({
        title: 'Успешно',
        message: 'Все данные пользователей успешно сброшены',
        type: 'success'
      });
    } catch (error) {
      console.error('Error resetting all users:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Произошла ошибка при сбросе данных',
        type: 'error'
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleGenerateTestUsers = async () => {
    setIsGenerating(true);
    try {
      await generateTestUsers(40);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSimulateActivity = async () => {
    setIsSimulating(true);
    try {
      await simulateUserActivity();
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-slate-200 mb-4">Панель администратора</h2>
      
      {/* Tasks Management */}
      <TasksManagement />
      
      <div className="space-y-3">
        {/* AOS Management */}
        <AOSManagement />
        
        <button
          onClick={handleGenerateTestUsers}
          disabled={isGenerating}
          className="w-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 py-2 px-4 rounded-md hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors flex items-center justify-center space-x-2"
        >
          <Users className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Генерация...' : 'Сгенерировать 40 тестовых пользователей'}</span>
        </button>

        <button
          onClick={handleSimulateActivity}
          disabled={isSimulating}
          className="w-full bg-blue-500/20 text-blue-200 border border-blue-500/30 py-2 px-4 rounded-md hover:bg-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors flex items-center justify-center space-x-2"
        >
          <Activity className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Симуляция...' : 'Симулировать активность пользователей'}</span>
        </button>

        <button
          onClick={handleSendTestMessage}
          disabled={isSendingMessage}
          className="w-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 py-2 px-4 rounded-md hover:bg-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors flex items-center justify-center space-x-2"
        >
          <MessageSquare className={`w-4 h-4 ${isSendingMessage ? 'animate-spin' : ''}`} />
          <span>{isSendingMessage ? 'Отправка...' : 'Отправить тестовое сообщение'}</span>
        </button>
        
        <div className="space-y-2">
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Введите сообщение для отправки в группу..."
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200 resize-none h-24"
          />
        </div>

        <button
          onClick={handleResetAllUsers}
          disabled={isResetting}
          className="w-full bg-red-500/20 text-red-200 border border-red-500/30 py-2 px-4 rounded-md hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors flex items-center justify-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Сброс...' : 'Сбросить все данные пользователей'}</span>
        </button>
      </div>
    </div>
  );
}