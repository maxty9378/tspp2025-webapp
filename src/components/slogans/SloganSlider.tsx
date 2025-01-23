import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { SliderControls } from '../slider/SliderControls';
import { SliderProgress } from '../slider/SliderProgress';
import { SloganSlide } from './SloganSlide';

interface Slogan {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
  };
  text: string;
  created_at: string;
}

export function SloganSlider() {
  const [slogans, setSlogans] = useState<Slogan[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlogans = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            first_name,
            last_name,
            photo_url,
            slogan,
            last_slogan_date
          `)
          .not('slogan', 'is', null)
          .order('last_slogan_date', { ascending: false })
          .limit(10);

        if (error) throw error;

        const formattedSlogans = data
          .filter(user => user.slogan)
          .map(user => ({
            id: user.id,
            user: {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              photo_url: user.photo_url
            },
            text: user.slogan!,
            created_at: user.last_slogan_date!
          }));

        setSlogans(formattedSlogans);
      } catch (error) {
        console.error('Error fetching slogans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlogans();
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slogans.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slogans.length) % slogans.length);
  };

  if (loading || slogans.length === 0) {
    return null;
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-slate-700/30">
        <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-emerald-primary" />
        </div>
        <div>
          <h3 className="font-medium text-emerald-light">Слоганы участников</h3>
          <p className="text-sm text-slate-400">
            {currentIndex + 1} из {slogans.length}
          </p>
        </div>
      </div>

      <div className="relative h-[160px]">
        <AnimatePresence mode="wait">
          <SloganSlide 
            key={currentIndex} 
            slogan={slogans[currentIndex]} 
          />
        </AnimatePresence>

        <SliderControls onPrev={handlePrev} onNext={handleNext} />
        
        <SliderProgress
          total={slogans.length}
          current={currentIndex}
          onChange={setCurrentIndex}
        />
      </div>
    </div>
  );
}