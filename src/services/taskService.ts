import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';

export async function checkLikesTaskCompletion(userId: string) {
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('likes, likes_task_completed')
      .eq('id', userId)
      .single();

    if (!userData) return;

    // Check if user has liked at least 2 different users
    const uniqueLikedUsers = new Set(userData.likes || []);
    
    if (uniqueLikedUsers.size >= 2 && !userData.likes_task_completed) {
      // Award points and mark task as completed
      await supabase
        .from('users')
        .update({
          likes_task_completed: true,
          points: supabase.rpc('increment_points', { amount: 10 }),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      showNotification({
        title: 'Задание выполнено!',
        message: 'Вы поставили лайки 2 разным участникам и получили +10 баллов',
        type: 'success'
      });

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    }
  } catch (error) {
    console.error('Error checking likes task:', error);
  }
}