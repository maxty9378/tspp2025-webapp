import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getFromCache, setInCache } from '../utils/cache';

interface TaskStatus {
  completed: boolean;
  points_awarded: number;
  completed_at: string | null;
}

const CACHE_OPTIONS = {
  duration: 5 * 60 * 1000, // 5 minutes
  prefix: 'task_status_'
};

export function useTaskCompletion(userId: string | null, taskId: string) {
  const [status, setStatus] = useState<TaskStatus>({
    completed: false,
    points_awarded: 0,
    completed_at: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const checkStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get from cache first
        const cached = getFromCache<TaskStatus>(`${userId}_${taskId}`, CACHE_OPTIONS);
        if (cached) {
          setStatus(cached);
          setLoading(false);
          return;
        }

        // Check task_completions table
        const { data: taskData } = await supabase
          .from('task_completions')
          .select('*')
          .eq('user_id', userId)
          .eq('task_id', taskId)
          .single();

        // Check points_history table
        const { data: pointsData } = await supabase
          .from('points_history')
          .select('*')
          .eq('user_id', userId)
          .eq('reason', taskId)
          .single();

        const newStatus = {
          completed: Boolean(taskData || pointsData),
          points_awarded: (taskData?.points_awarded || pointsData?.points_added || 0),
          completed_at: (taskData?.completed_at || pointsData?.created_at || null)
        };

        setStatus(newStatus);
        setInCache(`${userId}_${taskId}`, newStatus, CACHE_OPTIONS);

      } catch (error) {
        console.error('Error checking task status:', error);
        setError('Failed to check task status');
      } finally {
        setLoading(false);
      }
    };

    checkStatus();

    // Subscribe to updates
    const subscription = supabase
      .channel(`task_${userId}_${taskId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'task_completions',
          filter: `user_id=eq.${userId} AND task_id=eq.${taskId}`
        },
        () => checkStatus()
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'points_history',
          filter: `user_id=eq.${userId} AND reason=eq.${taskId}`
        },
        () => checkStatus()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, taskId]);

  return { ...status, loading, error };
}