import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { showNotification } from '../utils/notifications';

const SWIPE_THRESHOLD = 50;

export function GreetingCarousel() {
  const [greetings, setGreetings] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();

  useEffect(() => {
    const fetchGreetings = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .not('greeting_message', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setGreetings(data || []);
      } catch (error) {
        console.error('Error fetching greetings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGreetings();

    // Subscribe to greeting updates
    const subscription = supabase
      .channel('users_with_greetings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users', filter: 'greeting_message.is.not.null' },
        () => {
          fetchGreetings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const nextGreeting = () => {
    setCurrentIndex((prev) => (prev + 1) % greetings.length);
  };

  const prevGreeting = () => {
    setCurrentIndex((prev) => (prev - 1 + greetings.length) % greetings.length);
  };

  const handleDragStart = (event: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    setDragStart(clientX);
  };

  const handleDragMove = (event: React.TouchEvent | React.MouseEvent) => {
    if (dragStart === null) return;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const offset = clientX - dragStart;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (dragStart === null) return;

    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      if (dragOffset > 0) {
        prevGreeting();
      } else {
        nextGreeting();
      }

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
    }

    setDragStart(null);
    setDragOffset(0);
  };

  if (loading || greetings.length === 0) return null;

  const currentGreeting = greetings[currentIndex];

  const handleLike = async () => {
    if (!currentUserId || isLiking || currentGreeting.id === currentUserId) return;

    setIsLiking(true);
    try {
      // Получаем текущие данные пользователя, который ставит лайк
      const { data: currentUser } = await supabase
        .from('users')
        .select('likes_given, points, likes_task_completed')
        .eq('id', currentUserId)
        .single();

      if (!currentUser) return;

      // Получаем данные пользователя, которому ставят лайк
      const { data: freshUser } = await supabase
        .from('users')
        .select('liked_by')
        .eq('id', currentGreeting.id)
        .single();

      if (!freshUser) return;

      const newLikedBy = [...(freshUser.liked_by || []), currentUserId];
      const newLikesGiven = (currentUser.likes_given || 0) + 1;
      const shouldCompleteTask = newLikesGiven >= 2 && !currentUser.likes_task_completed;
      const pointsToAdd = shouldCompleteTask ? 10 : 0;

      // Обновляем данные пользователя, которому поставили лайк
      await supabase
        .from('users')
        .update({
          liked_by: newLikedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentGreeting.id);

      // Обновляем данные пользователя, который поставил лайк
      await supabase
        .from('users')
        .update({
          likes_given: newLikesGiven,
          points: (currentUser.points || 0) + pointsToAdd,
          likes_task_completed: shouldCompleteTask ? true : currentUser.likes_task_completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUserId);

      // Update local state
      setGreetings(prev => prev.map(user => 
        user.id === currentGreeting.id 
          ? { ...user, liked_by: newLikedBy }
          : user
      ));

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
        tg.HapticFeedback.notificationOccurred('success');
      }

      if (shouldCompleteTask) {
        showNotification({
          title: 'Задание выполнено!',
          message: 'Вы поставили 2 лайка и получили +10 баллов',
          type: 'success'
        });
      } else {
        showNotification({
          title: 'Успешно',
          message: 'Вам понравилось это приветствие',
          type: 'success'
        });
      }

    } catch (error) {
      console.error('Error liking greeting:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось поставить лайк',
        type: 'error'
      });
    } finally {
      setIsLiking(false);
    }
  };
  return (
    <div className="card p-3 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-emerald-primary" />
          </div>
          <div>
            <h3 className="font-medium text-emerald-light">Приветствия участников</h3>
            <p className="text-sm text-slate-400">
              {currentIndex + 1} из {greetings.length}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentGreeting.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-2 touch-none select-none"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          style={{ transform: `translateX(${dragOffset}px)` }}
        >
          <div className="flex items-center gap-2">
            {currentGreeting.photo_url ? (
              <img
                src={currentGreeting.photo_url}
                alt={currentGreeting.first_name}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <span className="text-sm font-medium text-emerald-light">
                  {currentGreeting.first_name[0]}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-emerald-light">
                {currentGreeting.first_name} {currentGreeting.last_name}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  disabled={isLiking || currentGreeting.id === currentUserId}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                    currentGreeting.liked_by?.includes(currentUserId || '')
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-red-500/20 hover:text-red-300'
                  }`}
                >
                  <Heart
                    className={`w-2.5 h-2.5 ${isLiking ? 'animate-pulse' : ''}`}
                    fill={currentGreeting.liked_by?.includes(currentUserId || '') ? 'currentColor' : 'none'}
                  />
                  {currentGreeting.liked_by?.length || 0}
                </button>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg">
            {currentGreeting.greeting_message}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}