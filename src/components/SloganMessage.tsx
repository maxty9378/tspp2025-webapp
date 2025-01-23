import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { sendMessageToGroup } from '../lib/telegramBot';
import { showNotification } from '../utils/notifications';

interface SloganMessageProps {
  user: UserProfile;
  onUpdate: () => void;
}

export function SloganMessage({ user, onUpdate }: SloganMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(user.slogan || '');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSave = async () => {
    if (!message.trim()) {
      showNotification({
        title: 'Ошибка',
        message: 'Слоган не может быть пустым',
        type: 'error'
      });
      return;
    }

    setIsSending(true);
    try {
      const finalMessage = message.trim();

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          slogan: finalMessage.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await sendMessageToGroup(`💫 Слоган от ${user.first_name} ${user.last_name || ''}\n\n${finalMessage} #Слоган`, user.id);

      showNotification({
        title: 'Успешно',
        message: user.slogan ? 'Слоган обновлён' : 'Слоган опубликован (+10 баллов)',
        type: 'success'
      });

      setIsEditing(false);
      onUpdate();

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }

    } catch (error) {
      console.error('Error updating slogan:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось обновить слоган',
        type: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-emerald-primary" />
        </div>
        <div>
          <h3 className="font-medium text-emerald-light">Слоган</h3>
          <p className="text-sm text-slate-400">
            {user.slogan ? 'Ваш слоган для конференции' : 'Придумайте слоган для конференции (+10 баллов)'}
          </p>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 resize-none min-h-[96px]"
            placeholder="Придумайте креативный слоган..."
            style={{ overflow: 'hidden' }}
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Отмена
              </button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isSending || !message.trim() || message === user.slogan}
                className="px-4 py-2 rounded-lg bg-emerald-primary text-white hover:bg-emerald-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSending ? 'Отправка...' : 'Отправить'}
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => !isSending && setIsEditing(true)}
          className="p-3 bg-slate-800/50 rounded-lg transition-colors cursor-pointer hover:bg-slate-800"
        >
          <div className="space-y-2">
            <p className="text-sm text-slate-300">
              {user.slogan && <span className="text-xs text-slate-400 block mb-1">Нажмите для редактирования</span>}
              {user.slogan || 'Нажмите, чтобы добавить слоган'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}