import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { SliderControls } from '../slider/SliderControls';
import { SliderProgress } from '../slider/SliderProgress';
import { GreetingSlide } from './GreetingSlide';

interface GreetingMessage {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
  };
  text: string;
  type: 'greeting' | 'quote';
  created_at: string;
}

export function GreetingSlider() {
  const [messages, setMessages] = useState<GreetingMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            first_name,
            last_name,
            photo_url,
            greeting_message,
            last_greeting_date
          `)
          .not('greeting_message', 'is', null)
          .order('last_greeting_date', { ascending: false })
          .limit(10);

        if (error) throw error;

        const formattedMessages = data
          .filter(user => user.greeting_message)
          .map(user => ({
            id: user.id,
            user: {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              photo_url: user.photo_url
            },
            text: user.greeting_message!,
            type: new Date(user.last_greeting_date!).getDay() === 1 ? 'greeting' : 'quote',
            created_at: user.last_greeting_date!
          }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % messages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + messages.length) % messages.length);
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
          <h3 className="font-medium text-emerald-light">Цитаты и приветствия</h3>
          <p className="text-sm text-slate-400">
            {currentIndex + 1} из {messages.length}
          </p>
        </div>
      </div>

      <div className="relative h-[200px]">
        <AnimatePresence mode="wait">
          <GreetingSlide 
            key={currentIndex} 
            message={messages[currentIndex]} 
          />
        </AnimatePresence>

        <SliderControls onPrev={handlePrev} onNext={handleNext} />
        
        <SliderProgress
          total={messages.length}
          current={currentIndex}
          onChange={setCurrentIndex}
        />
      </div>
    </div>
  );
}