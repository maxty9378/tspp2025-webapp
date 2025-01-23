import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';

export interface Program {
  id: string;
  day_index: number;
  time_start: string;
  time_end: string;
  title: string;
  description?: string;
  location?: string;
  duration?: string;
  speakers: Array<{
    id: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
    role: 'primary' | 'secondary' | 'tertiary';
  }>;
}

export function usePrograms() {
  const [programs, setPrograms] = useState<Record<number, Program[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          speakers:program_speakers(
            role,
            speaker:users(
              id,
              first_name,
              last_name,
              photo_url,
              position
            )
          )
        `)
        .order('time_start');

      if (error) throw error;

      // Group programs by day_index
      const grouped = (data || []).reduce((acc, program) => {
        const dayPrograms = acc[program.day_index] || [];
        
        // Format speakers array
        const speakers = program.speakers
          .map(s => ({
            ...s.speaker,
            role: s.role,
            position: s.speaker.position
          }))
          .sort((a, b) => {
            // Sort by role: primary first, then secondary, then tertiary
            const roleOrder = { primary: 0, secondary: 1, tertiary: 2 };
            return roleOrder[a.role] - roleOrder[b.role];
          });

        dayPrograms.push({
          ...program,
          speakers
        });
        
        acc[program.day_index] = dayPrograms;
        return acc;
      }, {} as Record<number, Program[]>);

      setPrograms(grouped);
      setError(null);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Не удалось загрузить расписание');
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить расписание',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();

    // Subscribe to program changes
    const subscription = supabase
      .channel('programs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'programs' },
        fetchPrograms
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'program_speakers' },
        fetchPrograms
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { programs, loading, error, refetch: fetchPrograms };
}