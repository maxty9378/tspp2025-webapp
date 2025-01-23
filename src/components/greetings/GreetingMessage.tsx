import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { UserProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import { GreetingForm } from './GreetingForm';
import { GreetingDisplay } from './GreetingDisplay';
import { useGreeting } from '../../hooks/useGreeting';
import { showNotification } from '../../utils/notifications';

interface GreetingMessageProps {
  user: UserProfile;
  onUpdate: () => void;
}

export function GreetingMessage({ user, onUpdate }: GreetingMessageProps) {
  const { 
    isEditing,
    setIsEditing,
    messageType,
    canPost,
    timeLeft,
    formatTimeLeft,
    lastPostType
  } = useGreeting(user);

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const getStatusMessage = () => {
    if (isLoading) return 'Загрузка...';
    if (message) {
      if (canPost) return 'Нажмите для редактирования';
      if (lastPostType) {
        return `Вы уже опубликовали ${lastPostType === 'greeting' ? 'приветствие' : 'цитату'} сегодня. Следующее сообщение через: ${formatTimeLeft(timeLeft)}`;
      }
      return `Следующее сообщение через: ${formatTimeLeft(timeLeft)}`;
    }
    if (messageType === 'Приветствие') {
      return 'Представьтесь и расскажите о себе (+10 баллов)';
    }
    return canPost ? 'Поделитесь вдохновляющей цитатой (+10 баллов)' : 'Цитату можно добавить завтра';
  };

  // Function to refresh greeting message
  const refreshGreeting = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('messages')
        .select('text')
        .eq('user_id', user.id)
        .eq('type', messageType.toLowerCase() === 'приветствие' ? 'greeting' : 'quote')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setMessage(data?.text || null);
    } catch (error) {
      console.error('Error fetching greeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshGreeting();
  }, [user.id, messageType]);

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

      // Create message record first
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          text: finalMessage,
          type: messageType === 'Приветствие' ? 'greeting' : 'quote',
          created_at: new Date().toISOString()
        });

      if (messageError) throw messageError;

      // Update user's greeting message and last_greeting_date
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          greeting_message: finalMessage,
          last_greeting_date: new Date().toISOString(),
          points: supabase.rpc('increment', { amount: 10 }),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const prefix = messageType === 'Приветствие' ? '👋' : '💫';
      const fullMessage = `${prefix} ${messageType} от ${user.first_name} ${user.last_name || ''}\n\n${finalMessage}`;
      await sendMessageToGroup(fullMessage, user.id);

      // Create task completion record
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          user_id: user.id,
          task_type: messageType === 'Приветствие' ? 'greeting' : 'quote',
          points_awarded: 10,
          metadata: {
            message: finalMessage,
            type: messageType
          },
          completed_at: new Date().toISOString()
        });

      if (completionError) throw completionError;
      showNotification({
        title: 'Успешно',
        message: `${messageType} опубликовано (+10 баллов)`,
        type: 'success'
      });
      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }

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
            {getStatusMessage()}
          </p>
        </div>
      </div>

      {isEditing ? (
        <GreetingForm
          user={user}
          messageType={messageType}
          canPost={canPost}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => {
            refreshGreeting();
            setIsEditing(false);
            onUpdate();
          }}
        />
      ) : (
        <div 
          onClick={() => {
            if (!canPost) {
              showNotification({
                title: 'Ограничение',
                message: lastPostType 
                  ? `Вы уже опубликовали ${lastPostType === 'greeting' ? 'приветствие' : 'цитату'} сегодня. Следующее сообщение через: ${formatTimeLeft(timeLeft)}`
                  : `Следующее сообщение через: ${formatTimeLeft(timeLeft)}`,
                type: 'warning'
              });
              return;
            }
            setIsEditing(true);
          }}
          className={`p-3 bg-slate-800/50 rounded-lg transition-colors ${
            isLoading ? 'opacity-50' : canPost ? 'cursor-pointer hover:bg-slate-800' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          {message && <span className="text-xs text-slate-400 block mb-1">
            {getStatusMessage()}
          </span>}
          <p className="text-sm text-slate-300">
            {isLoading ? 'Загрузка...' : message || 'Нажмите, чтобы добавить сообщение'}
          </p>
        </div>
      )}
    </div>
  );
}