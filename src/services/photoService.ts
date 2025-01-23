import { supabase } from '../lib/supabase';
import { compressImage } from '../utils/imageOptimizer';
import { showNotification } from '../utils/notifications';
import { logger } from '../utils/logger';

export async function uploadTeamPhoto(file: File, userId: string): Promise<boolean> {
  try {
    const compressedImage = await compressImage(file);
    const ext = file.name.split('.').pop();
    const filename = `team-activity-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('stories')
      .upload(filename, compressedImage);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('stories')
      .getPublicUrl(data.path);

    // Create message in chat
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        text: '#КоманднаяАктивность',
        type: 'team_activity',
        image_url: publicUrl,
        created_at: new Date().toISOString()
      });

    if (messageError) throw messageError;

    // Create task completion record
    const { error: completionError } = await supabase
      .from('task_completions')
      .insert({
        user_id: userId,
        task_type: 'team_photo',
        points_awarded: 10,
        metadata: {
          image_url: publicUrl,
          first_time: true
        },
        completed_at: new Date().toISOString()
      });

    if (completionError) throw completionError;

    showNotification({
      title: 'Фото опубликовано!',
      message: 'Вы получили +10 баллов за фото командной активности',
      type: 'success'
    });

    return true;

  } catch (error) {
    console.error('Error uploading team photo:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось загрузить фото',
      type: 'error'
    });
    return false;
  }
}

export async function uploadParticipantPhoto(file: File, userId: string): Promise<boolean> {
  try {
    const compressedImage = await compressImage(file);
    const ext = file.name.split('.').pop();
    const filename = `participants-photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('stories')
      .upload(filename, compressedImage);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('stories')
      .getPublicUrl(data.path);

    // Create message in chat
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        text: '#ФотоСУчастниками',
        type: 'image',
        image_url: publicUrl,
        created_at: new Date().toISOString()
      });

    if (messageError) throw messageError;

    // Create task completion record
    const { error: completionError } = await supabase
      .from('task_completions')
      .insert({
        user_id: userId,
        task_type: 'participants_photo',
        points_awarded: 10,
        metadata: {
          image_url: publicUrl,
          first_time: true
        },
        completed_at: new Date().toISOString()
      });

    if (completionError) throw completionError;

    showNotification({
      title: 'Фото опубликовано!',
      message: 'Вы получили +10 баллов за фото с участниками',
      type: 'success'
    });

    return true;

  } catch (error) {
    console.error('Error uploading participants photo:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось загрузить фото',
      type: 'error'
    });
    return false;
  }
}