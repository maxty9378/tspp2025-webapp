import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';

export function useQuizCompletions(userId: string | null) {
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompletedQuizzes = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('task_completions')
          .select('metadata')
          .eq('user_id', userId)
          .eq('task_type', 'surveys');
        
        if (error) throw error;
        
        if (data) {
          const completed = data
            .map(item => item.metadata?.quiz_id)
            .filter(Boolean);
          setCompletedQuizzes(completed);
        }
      } catch (error) {
        console.error('Error loading completed quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCompletedQuizzes();
  }, [userId]);

  const recordQuizCompletion = async (
    quizId: string,
    quizTitle: string,
    correctAnswers: number,
    totalQuestions: number,
    maxPoints: number = 40
  ) => {
    if (!userId) return false;

    // Check if quiz is already completed
    const { data: existing } = await supabase
      .from('task_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('task_type', 'surveys')
      .eq('metadata->>quiz_id', quizId)
      .maybeSingle();

    if (existing) {
      showNotification({
        title: 'Тест уже пройден',
        message: 'Вы уже проходили этот тест',
        type: 'warning'
      });
      return false;
    }

    try {
      const pointsEarned = maxPoints; // Always award full points for completion

      // Create completion record
      const { error: insertError } = await supabase
        .from('task_completions')
        .insert([{
          user_id: userId,
          task_type: 'surveys',
          points_awarded: pointsEarned,
          completed_at: new Date().toISOString(),
          metadata: {
            quiz_id: quizId,
            quiz_title: quizTitle,
            score: correctAnswers,
            total_questions: totalQuestions
          }
        }]);

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
          showNotification({
            title: 'Тест уже пройден',
            message: 'Вы уже проходили этот тест',
            type: 'warning'
          });
          return false;
        }
        throw insertError;
      }

      setCompletedQuizzes(prev => [...prev, quizId]);

      showNotification({
        title: 'Тест пройден!',
        message: `Вы заработали ${pointsEarned} баллов`,
        type: 'success'
      });

      return true;
    } catch (error) {
      console.error('Error recording quiz completion:', error);
      showNotification({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось сохранить результаты теста',
        type: 'error'
      });
      return false;
    }
  };

  return {
    completedQuizzes,
    loading,
    recordQuizCompletion
  };
}