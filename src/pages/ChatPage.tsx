import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Reply } from 'lucide-react';
import { useChatMessages } from '../hooks/useChatMessages';
import { useProfile } from '../hooks/useProfile';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { ChatHeader } from '../components/chat/ChatHeader';
import { supabase } from '../lib/supabase';
import { hapticFeedback } from '../utils/telegram';
import { showNotification } from '../utils/notifications';

interface ReplyToMessage {
  id: string;
  text: string;
  user: {
    first_name: string;
  };
}

export function ChatPage() {
  const navigate = useNavigate();
  const { profile } = useProfile(window.Telegram?.WebApp?.initDataUnsafe?.user || null);
  const { messages, loading, error, refetch } = useChatMessages();
  const [isInitialized, setIsInitialized] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyToMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = profile?.id;

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      // Configure back button
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        navigate('/');
        if (tg.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('light');
        }
      });
      
      // Expand app
      if (tg.expand) tg.expand();
      
      // Disable vertical swipes
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }

      setIsInitialized(true);
    }

    return () => {
      if (tg?.BackButton) {
        tg.BackButton.offClick();
        tg.BackButton.hide();
      }
      if (tg?.enableVerticalSwipes) {
        tg.enableVerticalSwipes();
      }
    };
  }, [navigate]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isInitialized || !profile) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-primary/20 border-t-emerald-primary rounded-full" />
      </div>
    );
  }

  const handleSend = async (text: string, type: 'text' | 'image', imageUrl?: string) => {
    if (!profile) return;

    try {
      const messageData = {
        user_id: profile.id,
        text,
        type,
        image_url: imageUrl,
        liked_by: [],
        likes: 0,
        reply_to: replyTo,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;

      // Add haptic feedback
      hapticFeedback('light');

      // Scroll to bottom immediately
      scrollToBottom();

      // Refetch messages
      refetch();
      
      // Clear reply state
      setReplyTo(null);

    } catch (error) {
      console.error('Error sending message:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось отправить сообщение',
        type: 'error'
      });
      hapticFeedback('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col overscroll-none">
      <ChatHeader messageCount={messages.length} loading={loading} />

      {error && (
        <div className="fixed top-[88px] left-4 right-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg z-10">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto px-4 pb-[120px] pt-12 overscroll-none"
        style={{
          height: '100%',
          WebkitOverflowScrolling: 'touch',
          position: 'relative'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-primary/20 border-t-emerald-primary rounded-full" />
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => message ? (
            <ChatMessage
              key={message.id}
              message={message}
              isCurrentUser={message.user_id === profile?.id} 
              onReply={setReplyTo}
            />
          ) : null)
        ) : (
          <div className="text-center text-slate-400 mt-8">
            Нет сообщений
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 z-20">
          {replyTo && (
            <div className="p-2 bg-slate-800/95 border-t border-slate-700/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Reply className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs text-emerald-300">
                      {replyTo.user.first_name}
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1">
                      {replyTo.text}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="p-1 hover:bg-slate-700/50 rounded-full"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          )}
          <ChatInput onSend={handleSend} />
        </div>
      )}
    </div>
  );
}