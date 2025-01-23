import { supabase } from './supabase';
import { showNotification } from '../utils/notifications';
import { Message } from '../types/chat';

export async function fetchMessages(limit = 50): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:users (
          id,
          first_name,
          last_name,
          photo_url,
          username
        )
      `)
      .eq('is_notification', false)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось загрузить сообщения',
      type: 'error'
    });
    return [];
  }
}

export async function sendMessage(
  userId: string,
  text: string,
  type: 'text' | 'image' = 'text',
  imageUrl?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('messages')
      .insert([{
        user_id: userId,
        text,
        type,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        liked_by: [],
        is_notification: false
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось отправить сообщение',
      type: 'error'
    });
    return false;
  }
}

export async function toggleMessageLike(
  messageId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data: message } = await supabase
      .from('messages')
      .select('liked_by')
      .eq('id', messageId)
      .single();

    if (!message) throw new Error('Message not found');

    const likedBy = message.liked_by || [];
    const isLiked = likedBy.includes(userId);
    const newLikedBy = isLiked
      ? likedBy.filter(id => id !== userId)
      : [...likedBy, userId];

    const { error } = await supabase
      .from('messages')
      .update({
        liked_by: newLikedBy,
        likes: newLikedBy.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) throw error;
    return !isLiked;
  } catch (error) {
    console.error('Error toggling like:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось поставить лайк',
      type: 'error'
    });
    return false;
  }
}