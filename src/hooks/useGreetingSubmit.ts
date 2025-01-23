import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { sendMessageToGroup } from '../lib/telegramBot';
import { showNotification } from '../utils/notifications';

export function useGreetingSubmit() {
  const [isSending, setIsSending] = useState(false);

  const submitGreeting = async (userId: string, message: string, messageType: string) => {
    if (!message.trim()) {
      showNotification({
        title: 'Ошибка',
        message: `${messageType} не может быть пустым`,
        type: 'error'
      });
      return false;
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
        .eq('id', userId);

      if (updateError) throw updateError;

      // Insert new message into messages table
      const { error: insertError } = await supabase
        .from('messages')
        .insert([{
          user_id: userId,
          message: finalMessage,
          message_type: messageType,
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      const prefix = messageType === 'Приветствие' ? '👋' : '💫';
      await sendMessageToGroup(finalMessage, userId);

      showNotification({
        title: 'Успешно',
        message: `${messageType} опубликовано (+10 баллов)`,
        type: 'success'
      });

      return true;
    } catch (error) {
      console.error('Error updating greeting:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось обновить сообщение',
        type: 'error'
      });
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return { submitGreeting, isSending };
}
