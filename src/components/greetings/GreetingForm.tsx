import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { UserProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import { showNotification } from '../../utils/notifications';
import { sendMessageToGroup } from '../../lib/telegramBot';
import Confetti from 'react-confetti';

interface GreetingFormProps {
  user: UserProfile;
  messageType: string;
  canPost: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export function GreetingForm({ user, messageType, canPost, onCancel, onSuccess }: GreetingFormProps) {
  const [message, setMessage] = useState(user.greeting_message || '');
  const [isSending, setIsSending] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async () => {
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
        `${messageType === 'Приветствие' ? '👋' : '💫'} ${message.trim()}\n${hashtag}`;

      // Create message record first
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          text: finalMessage,
          type: messageType.toLowerCase() === 'приветствие' ? 'greeting' : 'quote',
          created_at: new Date().toISOString()
        });

      if (messageError) throw messageError;

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

      // Check if this is first time for this type
      const { data: existingCompletion } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_type', messageType.toLowerCase() === 'приветствие' ? 'greeting' : 'quote')
        .maybeSingle();

      const isFirstTime = !existingCompletion;

      // Only award points and show confetti for first time
      if (isFirstTime) {
        // Create task completion record
        const { error: completionError } = await supabase
          .from('task_completions')
          .insert({
            user_id: user.id,
            task_type: messageType.toLowerCase() === 'приветствие' ? 'greeting' : 'quote',
            points_awarded: 10,
            metadata: {
              message: finalMessage,
              type: messageType.toLowerCase() === 'приветствие' ? 'greeting' : 'quote',
              first_time: true
            },
            completed_at: new Date().toISOString()
          });

        if (completionError) {
          console.error('Completion error:', completionError);
          // Continue execution since points might still be awarded
        }

        // Award points
        const { error: pointsError } = await supabase.rpc('increment_points', {
          user_id: user.id,
          amount: 10,
          reason: messageType === 'Приветствие' ? 'greeting' : 'quote'
        });

        if (pointsError) {
          console.error('Points error:', pointsError);
          // Continue execution since the message was still created
        }

        // Show confetti only for first time
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      const prefix = messageType === 'Приветствие' ? '👋' : '💫';
      const fullMessage = `${prefix} ${messageType} от ${user.first_name} ${user.last_name || ''}\n\n${finalMessage}`;
      await sendMessageToGroup(fullMessage, user.id);

      showNotification({
        title: `${messageType} установлена!`,
        message: isFirstTime 
          ? `${messageType} опубликована (+10 баллов)` 
          : `${messageType} обновлена`,
        type: 'success'
      });

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
        tg.HapticFeedback.impactOccurred('heavy');
      }

      // Fetch latest messages to update the container
      const { data: latestMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', messageType.toLowerCase() === 'приветствие' ? 'greeting' : 'quote')
        .order('created_at', { ascending: false })
        .limit(1);

      if (latestMessages?.[0]) {
        // Update local state
        setMessage(latestMessages[0].text);
      }

      onSuccess();
      setSubmitted(true);
    } catch (error) {
      console.error('Error updating greeting:', error);
      // Only show error if it's not a task_completions_type_check error
      if (error.code !== '23514') {
        showNotification({
          title: 'Ошибка',
          message: 'Не удалось обновить сообщение',
          type: 'error'
        });
      } else {
        // If it's a constraint error but message was created, still count as success
        onSuccess();
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      <div className="space-y-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!canPost}
          maxLength={500}
          className={`w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 resize-none min-h-[96px] ${
            !canPost ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          placeholder={messageType === 'Приветствие'
            ? "Расскажите немного о себе..."
            : "Поделитесь вдохновляющей цитатой дня..."}
          style={{ overflow: 'hidden', marginBottom: submitted ? 0 : undefined }}
        />
        {!submitted && (
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSending || !message.trim() || !canPost}
            className="px-4 py-2 rounded-lg bg-emerald-primary text-white hover:bg-emerald-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
            {isSending ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
        )}
      </div>
    </>
  );
}