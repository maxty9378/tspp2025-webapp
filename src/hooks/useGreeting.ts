import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

export function useGreeting(user: UserProfile) {
  const [isEditing, setIsEditing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canPost, setCanPost] = useState(false);
  const [lastPostType, setLastPostType] = useState<'greeting' | 'quote' | null>(null);

  const getCurrentDay = () => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day; // Convert Sunday (0) to 7
  };

  const isWeekday = () => {
    const day = getCurrentDay();
    return day >= 1 && day <= 5;
  };

  const getMessageType = () => {
    return getCurrentDay() === 1 ? 'Приветствие' : 'Цитата дня';
  };

  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return null;
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}ч ${minutes}м`;
  };

  useEffect(() => {
    const updateCooldown = async () => {
      if (!user.last_greeting_date) {
        setCanPost(isWeekday());
        setTimeLeft(0);
        setLastPostType(null);
        return;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Check for posts today
      const { data: todayPosts } = await supabase
        .from('messages')
        .select('type')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .neq('text', '')
        .in('type', ['greeting', 'quote'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (todayPosts?.length > 0) {
        // User has posted today
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        setTimeLeft(tomorrow.getTime() - now.getTime());
        setCanPost(false);
        setLastPostType(todayPosts[0].type);
        return;
      }

      // Check if can post based on day
      const currentDay = getCurrentDay();
      const canPostNow = currentDay === 1 ? true : isWeekday();

      setCanPost(canPostNow);
      setTimeLeft(0);
      setLastPostType(null);
    };

    updateCooldown();
    // Update more frequently for smoother countdown
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [user.id, user.last_greeting_date]);

  return {
    isEditing,
    setIsEditing,
    messageType: getMessageType(),
    canPost,
    timeLeft,
    formatTimeLeft,
    lastPostType
  };
}