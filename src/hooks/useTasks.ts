import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';
import { POINTS_CONFIG } from '../services/pointsService';

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'daily' | 'achievement' | 'story';
  created_at: string;
}

export async function validateTaskPoints(points: number): Promise<boolean> {
  if (points < POINTS_CONFIG.CUSTOM_TASK_MIN || points > POINTS_CONFIG.CUSTOM_TASK_MAX) {
    showNotification({
      title: 'Ошибка',
      message: `Баллы должны быть от ${POINTS_CONFIG.CUSTOM_TASK_MIN} до ${POINTS_CONFIG.CUSTOM_TASK_MAX}`,
      type: 'error'
    });
    return false;
  }
  return true;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить задания',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        showNotification({
          title: 'Ошибка',
          message: 'Не удалось загрузить задания',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // Subscribe to task updates
    const subscription = supabase
      .channel('tasks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { tasks, loading };
}