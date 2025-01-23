import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';

interface AOSProgram {
  id: string;
  title: string;
  enabled: boolean;
}

export function useAOS() {
  const [programs, setPrograms] = useState<AOSProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, enabled')
        .eq('type', 'aos')
        .order('created_at', { ascending: false });

      // Handle PGRST116 (no rows) gracefully
      if (error && error.code === 'PGRST116') {
        setPrograms([]);
        return;
      } else if (error) {
        throw error;
      }

      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching AOS programs:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить список АОС',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();

    // Subscribe to task changes
    const subscription = supabase
      .channel('aos_tasks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: "type=eq.aos" },
        fetchPrograms
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { programs, loading, error, refetch: fetchPrograms };
}