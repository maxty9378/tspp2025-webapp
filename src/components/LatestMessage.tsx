import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { openTelegramChat } from '../lib/telegramBot';

export function LatestMessage() {
  const [latestMessage, setLatestMessage] = useState<{
    text: string;
    sender_name: string;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    const fetchLatestMessage = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('text, sender_name, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLatestMessage(data);
      }
    };

    fetchLatestMessage();

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setLatestMessage(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!latestMessage) return null;

  const handleClick = () => {
    openTelegramChat();
  };

  return (
    <button 
      onClick={handleClick}
      className="w-full card p-4 hover:bg-slate-800/70 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-emerald-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-emerald-light">Последнее сообщение</h3>
            <span className="text-xs text-slate-400">
              {new Date(latestMessage.created_at).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-slate-400 truncate">
            {latestMessage.sender_name}: {latestMessage.text}
          </p>
        </div>
      </div>
    </button>
  );
}