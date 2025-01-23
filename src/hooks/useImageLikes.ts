import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';
import { hapticFeedback } from '../utils/telegram';

export function useImageLikes() {
  const [isLiking, setIsLiking] = useState(false);
  const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();

  const handleLike = async (messageId: string, currentLikes: number, likedBy: string[]) => {
    if (!currentUserId || isLiking) return false;

    const isLiked = likedBy.includes(currentUserId);
    setIsLiking(true);

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          liked_by: isLiked 
            ? likedBy.filter(id => id !== currentUserId)
            : [...likedBy, currentUserId],
          likes: isLiked ? currentLikes - 1 : currentLikes + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      // Add haptic feedback
      hapticFeedback(isLiked ? 'light' : 'medium');

      return true;
    } catch (error) {
      console.error('Error liking image:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось поставить лайк',
        type: 'error'
      });
      return false;
    } finally {
      setIsLiking(false);
    }
  };

  return {
    handleLike,
    isLiking,
    currentUserId
  };
}