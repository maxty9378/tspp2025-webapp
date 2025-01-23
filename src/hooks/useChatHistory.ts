import { useState, useEffect } from 'react';
import { ChatMessage, loadChatHistory, saveMessage, deleteMessage } from '../lib/chatHistory';

export function useChatHistory(userId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        const fetchedMessages = await loadChatHistory(userId, page);
        setMessages(prev => [...prev, ...fetchedMessages]);
        setHasMore(fetchedMessages.length === 50);
        setError(null);
      } catch (err) {
        setError('Failed to load messages');
        console.error('Error loading messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId, page]);

  const sendMessage = async (text: string, type: 'text' | 'image' = 'text', mediaUrl?: string) => {
    if (!userId) return false;

    const success = await saveMessage(userId, {
      text,
      sender_id: userId,
      type,
      media_url: mediaUrl
    });

    if (success) {
      // Refresh messages
      const newMessages = await loadChatHistory(userId, 0);
      setMessages(newMessages);
    }

    return success;
  };

  const removeMessage = async (messageId: string) => {
    if (!userId) return false;

    const success = await deleteMessage(userId, messageId);
    if (success) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }

    return success;
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    removeMessage,
    loadMore
  };
}