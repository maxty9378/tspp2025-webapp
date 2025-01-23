import React, { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTaskCompletions } from '../hooks/useTaskCompletions';
import { sendMessageToGroup } from '../lib/telegramBot';
import { hapticFeedback } from '../utils/telegram';
import { showNotification } from '../utils/notifications';

interface ExperienceShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'practice' | 'mistake';
  userId: string;
}

export function ExperienceShareModal({ isOpen, onClose, type, userId }: ExperienceShareModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { refetch } = useTaskCompletions();

  const handleSubmit = async () => {
    if (!message.trim() || isSending) {
      const tg = window.Telegram?.WebApp;
      if (tg?.showPopup) {
        tg.showPopup({
          title: 'Пустое сообщение',
          message: 'Пожалуйста, напишите что-нибудь перед отправкой',
          buttons: [{ type: 'ok' }]
        });
      }
      return;
    }

    setIsSending(true);
    try {
      // Check if already completed
      const { data: existingCompletion } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('task_type', type)
        .eq('metadata->first_time', true)
        .maybeSingle();

      if (existingCompletion) {
        const tg = window.Telegram?.WebApp;
        if (tg?.showPopup) {
          tg.showPopup({
            title: 'Задание уже выполнено',
            message: 'Вы уже получили баллы за это задание',
            buttons: [{ type: 'ok' }]
          });
        }
        return;
      }

      // Get user info for the message
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name, points')
        .eq('id', userId)
        .single();

      if (!userData) throw new Error('User not found');

      // Format message
      const prefix = type === 'practice' ? '💫 Опыт из практики' : '📝 Важный урок';
      const hashtag = type === 'practice' ? '#ОпытИзПрактики' : '#ВажныйУрок';
      const finalMessage = `${prefix} от ${userData.first_name} ${userData.last_name || ''}\n\n${message.trim()}\n\n${hashtag}`;

      // Create message in chat
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          text: finalMessage,
          type: type,
          created_at: new Date().toISOString()
        });

      if (messageError) throw messageError;

      // Send to Telegram group
      const messageResult = await sendMessageToGroup(finalMessage, userId);
      if (!messageResult) {
        throw new Error('Failed to send message to Telegram');
      }
      
      // Create completion record
      const metadata = {
        message,
        type,
        first_time: true,
        telegram_message_id: messageResult.message_id
      };
      
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          user_id: userId,
          task_type: type,
          points_awarded: 50,
          metadata
        });
      
      if (completionError) throw completionError;
      
      const tg = window.Telegram?.WebApp;
      if (tg?.showPopup) {
        tg.showPopup({
          title: 'Успешно!',
          message: 'Ваше сообщение опубликовано (+50 баллов)',
          buttons: [{ type: 'ok' }]
        });
      }
      
      await refetch(); // Обновляем список выполненных заданий
      hapticFeedback('success');

      setTimeout(() => {
        setMessage('');
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error sharing experience:', error);
      const tg = window.Telegram?.WebApp;
      if (tg?.showPopup) {
        tg.showPopup({
          title: 'Ошибка',
          message: error instanceof Error ? error.message : 'Не удалось опубликовать сообщение',
          buttons: [{ type: 'destructive', text: 'OK' }]
        });
      }
      hapticFeedback('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && userId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-700/30"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium text-amber-300">
                    {type === 'practice' ? 'Поделитесь опытом' : 'Поделитесь уроком'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {type === 'practice' 
                      ? 'Расскажите случай из практики с хорошими результатами'
                      : 'Расскажите о допущенной ошибке и чему она научила'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={type === 'practice' 
                  ? 'Опишите ситуацию из практики, ваши действия и результат...'
                  : 'Опишите ситуацию, ошибку и полученный урок...'}
                className="w-full h-40 px-4 py-3 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200 resize-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || isSending}
                  className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  <Send className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
                  {isSending ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}