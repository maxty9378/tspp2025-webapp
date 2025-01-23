import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { UserProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import { showNotification } from '../../utils/notifications';
import { sendMessageToGroup } from '../../lib/telegramBot';
import Confetti from 'react-confetti';

interface SloganFormProps {
  user: UserProfile;
  canPost: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export function SloganForm({ user, canPost, onCancel, onSuccess }: SloganFormProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
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
    const fetchLatestSlogan = async () => {
      const { data } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_type', 'slogan')
        .maybeSingle();

      setIsFirstTime(!data);

      // Fetch latest slogan text
      const { data: sloganData } = await supabase
        .from('messages')
        .select('text')
        .eq('user_id', user.id)
        .eq('type', 'slogan')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setMessage(sloganData?.text || '');
    };

    fetchLatestSlogan();
  }, [user.id]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async () => {
    if (!message.trim() || isSending) {
      showNotification({
        title: 'Ошибка',
        message: 'Слоган не может быть пустым',
        type: 'error'
      });
      return;
    }

    setIsSending(true);
    try {
      const finalMessage = message.includes('#Слоган') ? 
        message.trim() : 
        `✨ ${message.trim()}\n#Слоган`;
      
      // Create message record first
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          text: finalMessage,
          type: 'slogan',
          created_at: new Date().toISOString()
        });

      if (messageError) throw messageError;

      // Only award points and show confetti for first-time slogan
      if (isFirstTime) {
        // Award points
        const { error: pointsError } = await supabase.rpc('increment_points', {
          user_id: user.id,
          amount: 10,
          reason: 'slogan'
        });

        if (pointsError) {
          console.error('Points error:', pointsError);
        }

        // Create task completion record (only first time)
        const { error: completionError } = await supabase
          .from('task_completions')
          .insert({
            user_id: user.id,
            task_type: 'slogan',
            points_awarded: 10,
            metadata: {
              message: finalMessage,
              type: 'slogan',
              first_time: true
            },
            completed_at: new Date().toISOString()
          });

        if (completionError) {
          console.error('Completion error:', completionError);
        }

        // Show confetti only for first time
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      // Update user's slogan and points
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          slogan: finalMessage,
          last_slogan_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);


      // Show appropriate notification
      showNotification({
        title: 'Слоган установлен!',
        message: isFirstTime 
          ? 'Слоган опубликован (+10 баллов)' 
          : 'Слоган обновлен',
        type: 'success'
      });

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
        tg.HapticFeedback.impactOccurred('heavy');
      }

      onSuccess();
    } catch (error) {
      console.error('Error updating slogan:', error);
      // Continue with success flow even if there are non-critical errors
      onSuccess();
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
          placeholder="Придумайте креативный слоган для конференции..."
          style={{ overflow: 'hidden' }}
        />
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
      </div>
    </>
  );
}