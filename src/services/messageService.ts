import { supabase } from '../lib/supabase';
import { hapticFeedback } from '../utils/telegram';
import { showNotification } from '../utils/notifications';

export async function updateMessageLikes(messageId: string, userId: string): Promise<boolean> {
  try {
    // Get current message state
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('liked_by')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;
    if (!message) throw new Error('Message not found');

    // Calculate new liked_by array
    const likedBy = message.liked_by || [];
    const isLiked = likedBy.includes(userId);
    const newLikedBy = isLiked 
      ? likedBy.filter(id => id !== userId)
      : [...likedBy, userId];

    // Update message
    const { error: updateError } = await supabase
      .from('messages')
      .update({ liked_by: newLikedBy })
      .eq('id', messageId);

    if (updateError) throw updateError;

    // Add haptic feedback
    hapticFeedback(isLiked ? 'light' : 'medium');

    showNotification({
      title: 'Успешно',
      message: isLiked ? 'Лайк убран' : 'Лайк поставлен',
      type: 'success'
    });
    
    return true;
  } catch (error) {
    console.error('Error in updateMessageLikes:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось обновить лайк',
      type: 'error'
    });
    return false;
  }
}