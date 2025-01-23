import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';

export interface ChatMessage {
  id: string;
  user_id: string;
  text: string;
  type: string;
  image_url?: string;
  created_at: string;
  likes: number;
  liked_by: string[];
  is_from_telegram: boolean;
  sender_name?: string;
  user: {
    id: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
  };
}

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:users (
            id,
            first_name,
            last_name,
            photo_url
          )
        `)
        .in('type', ['text', 'image', 'greeting', 'quote', 'slogan', 'practice', 'mistake'])
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      
      // Ensure liked_by is always an array
      const processedData = data?.map(msg => ({
        ...msg,
        liked_by: msg.liked_by || [],
        likes: msg.likes || 0,
        user: msg.user || {}
      })) || [];
      
      setMessages(processedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Не удалось загрузить сообщения');
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить сообщения',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to messages changes
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { messages, loading, error, refetch: fetchMessages };
}