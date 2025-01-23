import { supabase, withConnection } from '../lib/supabase';
import { hapticFeedback } from './telegram';
import { showNotification } from './notifications';
import { sleep } from './helpers';
import { Database } from '../types/supabase';
import { logger } from './logger';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const DEBUG = true;

export async function uploadStory(file: File, hashtag: string, userId: string) {
  try {
    if (DEBUG) console.log('Starting photo upload:', { userId, hashtag });
    
    logger.info('Starting photo upload', userId, {
      hashtag,
      fileSize: file.size,
      fileType: file.type
    });

    // Check if user already uploaded today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: existingUploads } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('task_type', 'story')
      .gte('completed_at', today.toISOString())
      .single();

    if (existingUploads) {
      logger.warn('User already uploaded today', userId, {
        existingUpload: existingUploads
      });
      throw new Error('Вы уже опубликовали фото сегодня');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      logger.warn('File size exceeds limit', userId, {
        fileSize: file.size,
        maxSize: 5 * 1024 * 1024
      });
      throw new Error('Файл слишком большой (максимум 5MB)');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      logger.warn('Invalid file type', userId, {
        fileType: file.type
      });
      throw new Error('Поддерживаются только изображения');
    }

    // Create unique filename
    const ext = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${userId}-${timestamp}.${ext}`;
    logger.info('Generated filename', userId, { fileName });

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('stories')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      logger.error('Storage upload failed', userId, uploadError, {
        fileName,
        hashtag
      });
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('stories')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      logger.error('Failed to get public URL', userId, new Error('No public URL returned'), {
        fileName
      });
      throw new Error('Failed to get public URL');
    }

    logger.info('File uploaded successfully', userId, {
      fileName,
      publicUrl: urlData.publicUrl
    });

    // Create message in chat
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        type: 'image',
        image_url: urlData.publicUrl,
        text: hashtag,
        created_at: new Date().toISOString()
      });

    if (messageError) {
      logger.error('Message creation failed', userId, messageError, {
        hashtag,
        imageUrl: urlData.publicUrl
      });
      throw messageError;
    }

    logger.info('Message created successfully', userId, {
      hashtag,
      imageUrl: urlData.publicUrl
    });

    // Record task completion and award points
    const { error: completionError } = await supabase
      .from('task_completions')
      .insert({
        user_id: userId,
        task_type: 'story',
        points_awarded: 10,
        metadata: {
          image_url: urlData.publicUrl,
          hashtag
        },
        completed_at: new Date().toISOString()
      });

    if (completionError) {
      logger.error('Task completion recording failed', userId, completionError, {
        hashtag,
        imageUrl: urlData.publicUrl
      });
      throw completionError;
    }

    logger.info('Task completion recorded', userId, {
      hashtag,
      pointsAwarded: 10
    });

    // Update user points
    const { error: pointsError } = await supabase
      .from('users')
      .update({ 
        points: supabase.rpc('increment', { amount: 10 }),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (pointsError) {
      logger.error('Points update failed', userId, pointsError, {
        pointsToAdd: 10
      });
      throw pointsError;
    }

    logger.info('Points awarded successfully', userId, {
      pointsAwarded: 10,
      newTotal: null // Will be updated by the increment RPC
    });

    hapticFeedback('success');
    showNotification({
      title: 'Успешно',
      message: 'Фото опубликовано (+10 баллов)',
      type: 'success'
    });

    return true;

  } catch (error) {
    console.error('Photo upload error:', error);
    logger.error('Photo upload process failed', userId, error instanceof Error ? error : new Error('Unknown error'), {
      hashtag,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    hapticFeedback('error');
    showNotification({
      title: 'Ошибка',
      message: error instanceof Error 
        ? error.message
        : 'Не удалось загрузить фото',
      type: 'error'
    });
    throw error;
  }
}