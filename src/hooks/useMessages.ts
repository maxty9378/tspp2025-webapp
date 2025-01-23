import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';

export interface Message {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
  };
  text: string;
  type: string;
  created_at: string;
  likes_count: number;
  liked_by: string[];
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const fetchMessages = async () => {
    try {
      // Get messages with all relevant types
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          text,
          type,
          created_at,
          likes,
          liked_by,
          user:users!inner (
            id,
            first_name,
            last_name,
            photo_url
          )
        `)
        .in('type', ['greeting', 'quote', 'slogan', 'practice', 'mistake'])
        .order('created_at', { ascending: false })
        .limit(50);

      // Handle PGRST116 (no rows) and other errors gracefully
      if (error) {
        if (error.code === 'PGRST116') {
          // No messages yet, this is fine
          setMessages([]); 
          return; 
        }
        throw error;
      }

      // Process and validate messages
      const processedMessages = data?.map(msg => ({
        ...msg,
        liked_by: msg.liked_by || [],
        likes: msg.likes || 0
      })) || [];

      setMessages(processedMessages || []);
      setError(null);
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchMessages(), 2000 * Math.pow(2, retryCount));
      } else {
        // Don't show error for no messages
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to messages and likes changes
    const subscription = supabase
      .channel('messages_and_likes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        fetchMessages
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'message_likes' },
        fetchMessages
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { messages, loading, error, refetch: fetchMessages };
}