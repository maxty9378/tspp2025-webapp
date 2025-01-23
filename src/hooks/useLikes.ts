import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';
import { hapticFeedback } from '../utils/telegram';

export function useLikes() {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (targetId: string, currentUserId: string) => {
    if (!currentUserId || isLiking) return false;

    setIsLiking(true);
    try {
      // Get current user data
      const { data: currentUserData } = await supabase
        .from('users')
        .select('likes')
        .eq('id', currentUserId)
        .single();

      // Add like to target user
      const { data: updatedTarget, error: targetUpdateError } = await supabase
        .from('users')
        .rpc('add_like', {
          target_user_id: targetId,
          liker_id: currentUserId
        });

      if (targetUpdateError) throw targetUpdateError;

      hapticFeedback('medium');
      showNotification({
        title: 'Успешно',
        message: 'Лайк поставлен',
        type: 'success'
      });

      return true;
    } catch (error) {
      console.error('Error liking:', error);
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

  return { handleLike, isLiking };
}