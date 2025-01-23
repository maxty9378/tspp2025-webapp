import React, { useState } from 'react';
import { MessageSquarePlus, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';

export function SuggestionBox() {
  const [suggestion, setSuggestion] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!suggestion.trim() || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          text: `💡 Предложение: ${suggestion}`,
          type: 'suggestion',
          sender_name: 'Участник',
          is_from_app: true
        });

      if (error) throw error;

      setSuggestion('');
      showNotification({
        title: 'Успешно',
        message: 'Спасибо за ваше предложение!',
        type: 'success'
      });

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      console.error('Error sending suggestion:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось отправить предложение',
        type: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <MessageSquarePlus className="w-5 h-5 text-emerald-primary" />
        </div>
        <div>
          <h3 className="font-medium text-emerald-light">Есть предложение?</h3>
          <p className="text-sm text-slate-400">
            Поделитесь своими идеями по улучшению
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="Опишите ваше предложение..."
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200 resize-none h-24 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!suggestion.trim() || isSending}
            className="px-4 py-2 rounded-lg bg-emerald-primary/20 text-emerald-light hover:bg-emerald-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
            {isSending ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}