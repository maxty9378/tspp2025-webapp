import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';
import { logger } from '../utils/logger';

export const POINTS_CONFIG = {
  DAILY_GREETING: 10,
  DAILY_QUOTE: 10,
  SLOGAN: 10,
  TEAM_PHOTO: 10,
  PARTICIPANTS_PHOTO: 10,
  COINS_CONVERSION: 10,
  LIKES_TASK: 10,
  SURVEY_COMPLETION: 15,
  AOS_COMPLETION: 30,
  AOS_COMPLETION: 30,
  CUSTOM_TASK_MIN: 1,
  CUSTOM_TASK_MAX: 50
};

export type TaskType = 
  | 'daily'
  | 'greeting'
  | 'aos'
  | 'aos'
  | 'quote'
  | 'slogan'
  | 'team_photo'
  | 'participants_photo'
  | 'practice'
  | 'mistake'
  | 'survey';

export async function awardPoints(userId: string, amount: number, reason: string, metadata: any = {}) {
  try {
    logger.info('Awarding points', userId, {
      amount,
      reason,
      metadata
    });

    const { data, error } = await supabase.rpc('increment_user_points', {
      user_ids: [userId],
      points_to_add: amount,
      reason,
      metadata: JSON.stringify(metadata)
    });

    if (error) throw error;

    logger.info('Points awarded successfully', userId, {
      amount,
      reason,
      newTotal: data?.points
    });

    showNotification({
      title: 'Баллы начислены!',
      message: `+${amount} баллов за ${reason}`,
      type: 'success'
    });

    return true;
  } catch (error) {
    console.error('Error awarding points:', error);
    logger.error('Points award failed', userId, error instanceof Error ? error : new Error('Unknown error'), {
      amount,
      reason
    });
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось начислить баллы',
      type: 'error'
    });
    return false;
  }
}

export async function deductPoints(userId: string, amount: number, reason: string) {
  try {
    logger.info('Deducting points', userId, {
      amount,
      reason
    });

    const { data, error } = await supabase.rpc('increment_user_points', {
      user_ids: [userId],
      points_to_add: -amount,
      reason: `deduct_${reason}`
    });

    if (error) throw error;

    logger.info('Points deducted successfully', userId, {
      amount,
      reason,
      newTotal: data?.points
    });

    showNotification({
      title: 'Баллы списаны',
      message: `-${amount} баллов (${reason})`,
      type: 'info'
    });

    return true;
  } catch (error) {
    console.error('Error deducting points:', error);
    logger.error('Points deduction failed', userId, error instanceof Error ? error : new Error('Unknown error'), {
      amount,
      reason
    });
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось списать баллы',
      type: 'error'
    });
    return false;
  }
}

export async function checkTaskCompletion(userId: string, taskType: TaskType): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('task_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('task_type', taskType)
      .eq('metadata->first_time', true)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking task completion:', error);
    logger.error('Task completion check failed', userId, error instanceof Error ? error : new Error('Unknown error'), {
      taskType
    });
    return false;
  }
}