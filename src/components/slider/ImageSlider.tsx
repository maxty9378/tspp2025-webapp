import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { SliderProgress } from './SliderProgress';
import { ImageSlide } from './ImageSlide';

const SWIPE_THRESHOLD = 50;

export function ImageSlider() {
  const [images, setImages] = useState<{ id: string; url: string; likes: number; liked_by: string[] }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, image_url, likes, liked_by')
          .eq('type', 'image')
          .not('image_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        const validImages = data
          .filter(msg => msg.image_url)
          .map(msg => ({
            id: msg.id,
            url: msg.image_url || '',
            likes: msg.likes || 0,
            liked_by: msg.liked_by || []
          }));

        setImages(validImages);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: "type=eq.image" },
        () => fetchImages()
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
        (currentIndex === images.length - 1 && offset < 0)) {
      setDragOffset(offset * 0.3);
    }
  };

  const handleTouchEnd = () => {
    if (dragStart === null) return;

    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      if (dragOffset > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (dragOffset < 0 && currentIndex < images.length - 1) {
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

  if (loading || images.length === 0) {
    return null;
  }

  return (
    <div className="card overflow-hidden">
      <div 
        className="relative h-[180px] touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <ImageSlide
            key={currentIndex}
            imageUrl={images[currentIndex].url}
            messageId={images[currentIndex].id}
            likes={images[currentIndex].likes}
            likedBy={images[currentIndex].liked_by}
            onLike={() => {
              const fetchImages = async () => {
                const { data } = await supabase
                  .from('messages')
                  .select('id, image_url, likes_count, liked_by')
                  .eq('type', 'image')
                  .not('image_url', 'is', null)
                  .order('created_at', { ascending: false })
                  .limit(5);

                if (data) {
                  const validImages = data
                    .filter(msg => msg.image_url)
                    .map(msg => ({
                      id: msg.id,
                      url: msg.image_url || '',
                      likes: msg.likes_count || 0,
                      liked_by: msg.liked_by || []
                    }));

                  setImages(validImages);
                }
              };
              fetchImages();
            }}
          />
        </AnimatePresence>
        
        <SliderProgress
          total={images.length}
          current={currentIndex}
          onChange={setCurrentIndex}
        />
      </div>
    </div>
  );
}