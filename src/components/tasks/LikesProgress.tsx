import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import { showNotification } from '../../utils/notifications';

interface LikesProgressProps {
  user: UserProfile;
}

export function LikesProgress({ user }: LikesProgressProps) {
  const [dailyLikes, setDailyLikes] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyLikes = async () => {
      try {
        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all messages where user is in liked_by array
        const { data: messages, error } = await supabase
          .from('messages')
          .select('id, liked_by')
          .gte('created_at', today.toISOString());

        if (error) throw error;

        // Count likes given today
        const todayLikes = messages?.filter(msg => 
          msg.liked_by?.includes(user.id)
        ).length || 0;

        setDailyLikes(todayLikes);

        // Check if task is already completed today
        const { data: completionData } = await supabase
          .from('task_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('task_type', 'daily_likes')
          .gte('completed_at', today.toISOString())
          .maybeSingle();

        setIsCompleted(Boolean(completionData));

        // If not completed and reached 10 likes, complete task
        if (!completionData && todayLikes >= 10) {
          const { error: completionError } = await supabase
            .from('task_completions')
            .insert({
              user_id: user.id,
              task_type: 'daily_likes',
              points_awarded: 10,
              metadata: {
                likes_count: todayLikes,
                completed_at: new Date().toISOString()
              }
            });

          if (!completionError) {
            setIsCompleted(true);
            showNotification({
              title: 'Задание выполнено!',
              message: 'Вы поставили 10 лайков и получили +10 баллов',
              type: 'success'
            });

            // Add haptic feedback
            const tg = window.Telegram?.WebApp;
            if (tg?.HapticFeedback) {
              tg.HapticFeedback.notificationOccurred('success');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyLikes();

    // Subscribe to message updates
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchDailyLikes()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user.id]);

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-8 bg-slate-800/50 rounded-lg w-2/3 mb-2" />
        <div className="h-4 bg-slate-800/50 rounded-lg w-1/2" />
      </div>
    );
  }

  return (
    <motion.div 
      className={`card p-4 relative overflow-hidden ${
        isCompleted 
          ? 'bg-emerald-500/10 border border-emerald-500/20' 
          : 'bg-red-500/5 border border-red-500/20'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Decorative background hearts */}
      <div className="absolute inset-0 pointer-events-none">
        <Heart className="absolute -right-4 -top-4 w-24 h-24 text-red-500/5 transform rotate-12" />
        <Heart className="absolute -left-4 -bottom-4 w-24 h-24 text-red-500/5 transform -rotate-12" />
      </div>

      <div className="relative flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isCompleted ? 'bg-emerald-500/20' : 'bg-red-500/20'
        }`}>
          <Heart className={`w-4 h-4 ${
            isCompleted ? 'text-emerald-400' : 'text-red-400'
          }`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${
              isCompleted ? 'text-emerald-300' : 'text-red-300'
            }`}>
              Поставить 10 лайков
            </h4>
            <div className={`flex items-center gap-1 ${
              isCompleted ? 'text-emerald-400' : 'text-red-400'
            }`}>
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">
                {dailyLikes}/10
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            {isCompleted 
              ? 'Задание выполнено на сегодня' 
              : 'Поставьте 10 лайков на публикации коллег (+10 баллов)'}
          </p>
          {!isCompleted && (
            <div className="mt-2 h-1.5 bg-red-950/30 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-500 to-red-400"
                initial={{ width: 0 }}
                animate={{ width: `${(dailyLikes / 10) * 100}%` }}
                transition={{ type: "spring", stiffness: 100 }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}