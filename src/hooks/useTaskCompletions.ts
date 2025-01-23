import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TaskCompletion } from '../types';
import { hapticFeedback } from '../utils/telegram';
import { sleep } from '../utils/helpers';
import { showNotification } from '../utils/notifications';
import { deductPoints } from '../services/pointsService';

export interface TaskCompletions {
  coins: TaskCompletion[];
  likes: TaskCompletion[];
  surveys: TaskCompletion[];
  aos: TaskCompletion[];
  stories: TaskCompletion[];
  practice: TaskCompletion[];
  mistake: TaskCompletion[];
  daily: TaskCompletion[];
  greeting: TaskCompletion[];
  quote: TaskCompletion[];
  slogan: TaskCompletion[];
  team_photo: TaskCompletion[];
  participants_photo: TaskCompletion[];
}

export function useTaskCompletions() {
  const [completions, setCompletions] = useState<TaskCompletions>({
    coins: [],
    likes: [],
    surveys: [],
    aos: [],
    stories: [],
    practice: [],
    mistake: [],
    daily: [],
    greeting: [],
    quote: [],
    slogan: [],
    team_photo: [],
    participants_photo: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;
  const [isRefetching, setIsRefetching] = useState(false);

  const refetch = async () => {
    try {
      setIsRefetching(true);
      setError(null);
      const { data, error } = await supabase
        .from('task_completions')
        .select(`
          id,
          user_id,
          task_type,
          points_awarded,
          metadata,
          completed_at,
          user:users (
            id,
            first_name,
            last_name,
            photo_url
          )
        `)
        .order('completed_at', { ascending: false })
        .limit(50)
        .throwOnError();

      // Handle PGRST116 (no rows) gracefully
      if (error && error.code === 'PGRST116') {
        setCompletions({
          coins: [],
          likes: [],
          surveys: [],
          aos: [],
          stories: [],
          practice: [],
          mistake: [],
          daily: [],
          greeting: [],
          quote: [],
          slogan: [],
          team_photo: [],
          participants_photo: []
        });
        return;
      } else if (error) {
        console.error('Error fetching completions:', error);
        throw error;
        return;
      }

      // Initialize all task types with empty arrays
      const initialState = {
        coins: [],
        likes: [],
        surveys: [],
        stories: [],
        practice: [],
        mistake: [],
        daily: [],
        greeting: [],
        quote: [],
        slogan: [],
        team_photo: [],
        participants_photo: []
      };

      const grouped = (data || []).reduce((acc, completion) => {
        if (!acc[completion.task_type]) {
          acc[completion.task_type] = [];
        }
        acc[completion.task_type].push(completion);
        return acc;
      }, initialState);

      setCompletions(grouped);
      setError(null);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error in fetchCompletions:', error);

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        await sleep(RETRY_DELAY * Math.pow(2, retryCount));
        await refetch();
      } else {
        setError(null); // Don't show error to user, just log it
      }
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  };

  const removeTaskCompletion = async (completionId: string) => {
    try {
      // Get completion details first
      const { data: completion } = await supabase
        .from('task_completions')
        .select('id, user_id, task_type, points_awarded, metadata')
        .eq('id', completionId)
        .single();

      // Deduct points if completion exists
      if (completion) {
        await deductPoints(
          completion.user_id,
          completion.points_awarded,
          `task_${completion.task_type}`
        );
      }

      // Remove completion record
      const { error: deleteError } = await supabase
        .from('task_completions')
        .delete()
        .eq('id', completionId);

      if (deleteError) throw deleteError;

      // Refresh completions
      await refetch();

      hapticFeedback('success');
      showNotification({
        title: 'Успешно',
        message: 'Отметка о выполнении удалена',
        type: 'success'
      });

      return true;
    } catch (error) {
      console.error('Error removing task completion:', error);
      hapticFeedback('error');
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось удалить отметку о выполнении',
        type: 'error'
      });
      return false;
    }
  };

  const addTaskCompletion = async (userId: string, taskId: string, points: number) => {
    try {
      // Create task completion record
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          user_id: userId,
          task_type: 'achievement',
          points_awarded: points,
          metadata: {
            task_id: taskId,
            first_time: true
          },
          completed_at: new Date().toISOString()
        });

      if (completionError) throw completionError;

      // Award points
      const { error: pointsError } = await supabase.rpc('increment_points', {
        user_id: userId,
        amount: points,
        reason: 'achievement'
      });

      if (pointsError) throw pointsError;

      // Refresh completions
      await refetch();

      hapticFeedback('success');
      showNotification({
        title: 'Задание выполнено',
        message: `Пользователю начислено ${points} баллов`,
        type: 'success'
      });

      return true;
    } catch (error) {
      console.error('Error adding task completion:', error);
      hapticFeedback('error');
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось отметить выполнение задания',
        type: 'error'
      });
      return false;
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await refetch();
    };
    
    fetchInitialData();

    // Set up auto-retry on connection errors
    const retryInterval = setInterval(() => {
      if (error) {
        setRetryCount(0);
        refetch();
      }
    }, 30000); // Retry every 30 seconds if there's an error

    // Subscribe to task completion updates
    const subscription = supabase
      .channel('task_completions')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'task_completions' 
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      clearInterval(retryInterval);
    };
  }, []);

  return { 
    completions, 
    loading: loading || isRefetching, 
    error, 
    removeTaskCompletion, 
    addTaskCompletion,
    refetch 
  };
}