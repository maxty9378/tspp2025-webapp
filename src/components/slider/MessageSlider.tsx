import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { SliderProgress } from './SliderProgress';
import { MessageSlide } from './MessageSlide';

const SWIPE_THRESHOLD = 50;

export function MessageSlider() {
  const [messages, setMessages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          text,
          type,
          created_at,
          likes_count,
          liked_by,
          user:users (
            id,
            first_name,
            last_name,
            photo_url
          )
        `)
        .in('type', ['greeting', 'quote', 'slogan', 'practice', 'mistake'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        fetchMessages
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStart(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStart === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offset = clientX - dragStart;
    setDragOffset(offset);

    // Add resistance at edges
    if ((currentIndex === 0 && offset > 0) || 
        (currentIndex === messages.length - 1 && offset < 0)) {
      setDragOffset(offset * 0.3);
    }
  };

  const handleTouchEnd = () => {
    if (dragStart === null) return;

    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      if (dragOffset > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (dragOffset < 0 && currentIndex < messages.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
    }

    setDragStart(null);
    setDragOffset(0);
  };

  if (loading || messages.length === 0) {
    return null;
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-slate-700/30">
        <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-emerald-primary" />
        </div>
        <div>
          <h3 className="font-medium text-emerald-light">Сообщения участников</h3>
          <p className="text-sm text-slate-400">
            {currentIndex + 1} из {messages.length}
          </p>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative h-[200px] touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            style={{ 
              x: dragOffset,
              transition: dragStart === null ? 'transform 0.3s ease-out' : 'none'
            }}
          >
            <MessageSlide 
              message={messages[currentIndex]} 
              onLike={fetchMessages}
            />
          </motion.div>
        </AnimatePresence>
        
        <SliderProgress
          total={messages.length}
          current={currentIndex}
          onChange={setCurrentIndex}
        />
      </div>
    </div>
  );
}