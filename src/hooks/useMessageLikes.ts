import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';
import { getFromCache, setInCache } from '../utils/cache';
import { hapticFeedback } from '../utils/telegram';

interface OptimisticLikeState {
  liked: boolean;
  count: number;
}

const LIKES_CACHE_KEY = 'message_likes';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCachedLikes(): Record<string, OptimisticLikeState> {
  return getFromCache(LIKES_CACHE_KEY, { duration: CACHE_DURATION }) || {};
}

function setCachedLikes(likes: Record<string, OptimisticLikeState>) {
  setInCache(LIKES_CACHE_KEY, likes, { duration: CACHE_DURATION });
}

const getCurrentUserId = () => {
  const tg = window.Telegram?.WebApp;
  if (tg?.initDataUnsafe?.user?.id) {
    return tg.initDataUnsafe.user.id.toString(); 
  }
  // For browser testing or admin
  if (localStorage.getItem('admin_auth') === 'true') {
    return localStorage.getItem('adminUsername')?.replace('@', '') || 'admin';
  }
  return null;
};

export function useMessageLikes() {
  const [isLiking, setIsLiking] = useState(false);
  const currentUserId = getCurrentUserId();
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, OptimisticLikeState>>(() => getCachedLikes());

  const handleLike = async (messageId: string) => {
    if (!currentUserId || isLiking) return false;

    setIsLiking(true);
    
    try {
      // Get current message state
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('liked_by, likes, user_id')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;
      if (!message) throw new Error('Message not found');

      // Calculate new state
      const likedBy = message.liked_by || [];
      const isLiked = likedBy.includes(currentUserId);
      const newLikedBy = isLiked 
        ? likedBy.filter(id => id !== currentUserId)
        : [...likedBy, currentUserId];
      const newLikes = newLikedBy.length;

      // Set optimistic state
      const newOptimisticState = {
        liked: !isLiked,
        count: newLikes
      };

      setOptimisticLikes(prev => ({
        ...prev,
        [messageId]: newOptimisticState
      }));

      // Update cache
      const cachedLikes = getCachedLikes();
      cachedLikes[messageId] = newOptimisticState;
      setCachedLikes(cachedLikes);

      // Update message
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          liked_by: newLikedBy,
          likes: newLikes,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) throw updateError;

      // Add haptic feedback
      hapticFeedback(!isLiked ? 'medium' : 'light');

      return true;
    } catch (error) {
      console.error('Error in handleLike:', error);
      
      // Revert optimistic update on error
      setOptimisticLikes(prev => {
        const { [messageId]: _, ...rest } = prev;
        return rest;
      });

      // Remove from cache
      const cachedLikes = getCachedLikes();
      delete cachedLikes[messageId];
      setCachedLikes(cachedLikes);

      showNotification({
        title: 'Ошибка',
        message: 'Не удалось обновить лайк',
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
    currentUserId,
    optimisticLikes
  };
}