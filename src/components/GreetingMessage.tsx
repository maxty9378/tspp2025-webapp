// src/components/GreetingMessage.tsx
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { sendMessageToGroup } from '../lib/telegramBot';
import { showNotification } from '../utils/notifications';

const getCurrentDay = () => {
  const day = new Date().getDay();
  return day === 0 ? 7 : day; // Convert Sunday (0) to 7
};

const isWeekday = () => {
  const day = getCurrentDay();
  return day >= 1 && day <= 5;
};

const getMessageType = () => {
  return getCurrentDay() === 1 ? 'Приветствие' : 'Цитата дня';
};

interface GreetingMessageProps {
  user: UserProfile;
  onUpdate: () => void;
}

export function GreetingMessage({ user, onUpdate }: GreetingMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(user.greeting_message || '');
  const [isSending, setIsSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canPost, setCanPost] = useState(false);

  useEffect(() => {
    const updateCooldown = () => {
      if (!user.last_greeting_date) return;
      
      const now = new Date();
      const lastGreeting = new Date(user.last_greeting_date);
      
      // Check if it's a different day
      const isDifferentDay = now.getDate() !== lastGreeting.getDate();
      const isCorrectDay = getCurrentDay() === 1 ? true : getCurrentDay() > 1;
      setCanPost(isDifferentDay && isWeekday() && isCorrectDay);
      
      if (!isDifferentDay) {
        // Calculate time until midnight
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        setTimeLeft(tomorrow.getTime() - now.getTime());
      } else {
        setTimeLeft(0);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [user.last_greeting_date]);

  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return null;
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}ч ${minutes}м`;
  };

  const messageType = getMessageType();

  const handleSave = async () => {
    if (!message.trim()) {
      showNotification({
        title: 'Ошибка',
        message: `${messageType} не может быть пустым`,
        type: 'error'
      });
      return;
    }

    if (!canPost) {
      showNotification({
        title: 'Ограничение',
        message: 'Сообщения можно отправлять только по будням, один раз в день',
        type: 'error'
      });
      return;
    }

    setIsSending(true);
    try {
      const hashtag = messageType === 'Приветствие' ? '#Приветствие' : '#ЦитатаДня';
      const finalMessage = message.includes(hashtag) ? 
        message.trim() : 
        `${message.trim()} ${hashtag}`;

      // Update user's greeting message and last_greeting_date
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          greeting_message: finalMessage,
          last_greeting_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const prefix = messageType === 'Приветствие' ? '👋' : '💫';
      const fullMessage = `${prefix} ${messageType} от ${user.first_name} ${user.last_name || ''}\n\n${finalMessage}`;
      await sendMessageToGroup(fullMessage, user.id);

      showNotification({
        title: 'Успешно',
        message: `${messageType} опубликовано (+10 баллов)`,
        type: 'success'
      });

      setIsEditing(false);
      onUpdate();

    } catch (error) {
      console.error('Error updating greeting:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось обновить сообщение',
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
          <h3 className="font-medium text-emerald-light">{messageType}</h3>
          <p className="text-sm text-slate-400">
            {messageType === 'Приветствие'
              ? 'Представьтесь и расскажите о себе'
              : 'Поделитесь вдохновляющей цитатой'} 
            {canPost && ' (+10 баллов)'}
          </p>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)} 
            disabled={!canPost}
            maxLength={500}
            className={`w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 resize-none h-24 ${
              !canPost ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            placeholder={messageType === 'Приветствие'
              ? "Расскажите немного о себе..."
              : "Поделитесь вдохновляющей цитатой дня..."}
          />
          <div className="flex items-center justify-between">
            {timeLeft > 0 && (
              <div className="text-sm text-slate-400">
                Следующее сообщение через: {formatTimeLeft(timeLeft)}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={isSending || !message.trim() || !canPost}
                className="px-4 py-2 rounded-lg bg-emerald-primary text-white hover:bg-emerald-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
                {isSending ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => canPost && setIsEditing(true)}
          className={`p-3 bg-slate-800/50 rounded-lg transition-colors ${
            !canPost ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-800'
          }`}
        >
          <div className="space-y-2">
            <p className="text-sm text-slate-300">
              {user.greeting_message || `Нажмите, чтобы добавить ${messageType.toLowerCase()}`}
            </p>
            {timeLeft > 0 && (
              <p className="text-xs text-slate-400">
                Следующее сообщение через: {formatTimeLeft(timeLeft)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
