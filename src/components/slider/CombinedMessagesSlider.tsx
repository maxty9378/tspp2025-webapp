import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessages } from '../../hooks/useMessages';
import { MessageSlide } from './MessageSlide';
import { hapticFeedback } from '../../utils/telegram';
import { useWindowSize } from '../../hooks/useWindowSize';
import { shouldReduceAnimations } from '../../utils/platform';

const SWIPE_THRESHOLD = 50;

export function CombinedMessagesSlider() {
  const windowSize = useWindowSize();
  const { messages, loading, error, refetch } = useMessages();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceAnimations = shouldReduceAnimations();

  useEffect(() => {
    // Filter messages to include only greeting, quote, slogan, practice, and mistake types
    const filtered = messages.filter(msg => 
      ['greeting', 'quote', 'slogan', 'practice', 'mistake'].includes(msg.type)
    );
    setFilteredMessages(filtered);
  }, [messages]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStart(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (dragStart === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offset = clientX - dragStart;
    setDragOffset(offset);

    // Add resistance at edges
    if ((currentIndex === 0 && offset > 0) || 
        (currentIndex === filteredMessages.length - 1 && offset < 0)) {
      setDragOffset(offset * 0.3);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (dragStart === null) return;

    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      if (dragOffset > 0 && currentIndex > 0 && filteredMessages.length > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (dragOffset < 0 && currentIndex < filteredMessages.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }

      hapticFeedback('light');
    }

    setDragStart(null);
    setDragOffset(0);
  };

  if (loading) {
    return (
      <div className="card p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-700 rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-700 rounded" />
            <div className="h-3 w-24 bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || filteredMessages.length === 0) {
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
            {currentIndex + 1} из {filteredMessages.length}
          </p>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative h-[200px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            style={{ 
              x: dragOffset, 
              transition: dragStart === null ? `transform ${reduceAnimations ? 0.2 : 0.3}s ease-out` : 'none'
            }}
          >
            <MessageSlide
              key={filteredMessages[currentIndex].id}
              message={filteredMessages[currentIndex]}
              onLike={refetch}
              reduceAnimations={reduceAnimations}
            />
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {Array.from({ length: filteredMessages.length }).map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-4' 
                  : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}