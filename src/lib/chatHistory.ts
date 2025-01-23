import { supabase } from './supabase';
import { showNotification } from '../utils/notifications';

export interface ChatMessage {
  id: string;
  text: string;
  sender_id: string;
  timestamp: string;
  type: 'text' | 'image' | 'system';
  media_url?: string;
}

const MESSAGES_PER_PAGE = 50;

export async function loadChatHistory(userId: string, page = 0): Promise<ChatMessage[]> {
  try {
    const { data: history, error } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No history found, create new entry
        const { error: insertError } = await supabase
          .from('chat_history')
          .insert({ user_id: userId, messages: [] });

        if (insertError) throw insertError;
        return [];
      }
      throw error;
    }

    const messages = history?.messages || [];
    const start = page * MESSAGES_PER_PAGE;
    return messages.slice(start, start + MESSAGES_PER_PAGE);
  } catch (error) {
    console.error('Error loading chat history:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось загрузить историю чата',
      type: 'error'
    });
    return [];
  }
}

export async function saveMessage(userId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<boolean> {
  try {
    const newMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    const { data: history, error: fetchError } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    const existingMessages = history?.messages || [];
    const updatedMessages = [...existingMessages, newMessage];

    const { error: updateError } = await supabase
      .from('chat_history')
      .upsert({
        user_id: userId,
        messages: updatedMessages,
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      });

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error saving message:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось сохранить сообщение',
      type: 'error'
    });
    return false;
  }
}

export async function clearChatHistory(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_history')
      .update({ messages: [] })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error clearing chat history:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось очистить историю чата',
      type: 'error'
    });
    return false;
  }
}

export async function deleteMessage(userId: string, messageId: string): Promise<boolean> {
  try {
    const { data: history, error: fetchError } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const messages = history?.messages || [];
    const updatedMessages = messages.filter(msg => msg.id !== messageId);

    const { error: updateError } = await supabase
      .from('chat_history')
      .update({ messages: updatedMessages })
      .eq('user_id', userId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось удалить сообщение',
      type: 'error'
    });
    return false;
  }
}