import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Users, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../utils/imageOptimizer';
import { showNotification } from '../../utils/notifications';
import { hapticFeedback } from '../../utils/telegram';

interface PhotoTasksProps {
  user: UserProfile;
  onPhotoUpload?: () => void;
}

export function PhotoTasks({ user, onPhotoUpload }: PhotoTasksProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const participantsPhotoInputRef = useRef<HTMLInputElement>(null);
  const [hasCompletedParticipantsPhoto, setHasCompletedParticipantsPhoto] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canPostTeamPhoto, setCanPostTeamPhoto] = useState(true);

  useEffect(() => {
    // Check if participants photo task is completed
    supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_type', 'participants_photo')
      .eq('metadata->first_time', true)
      .limit(1)
      .then(({ data }) => {
        setHasCompletedParticipantsPhoto(Boolean(data?.length));
      });
  }, [user.id]);

  useEffect(() => {
    const updateCooldown = () => {
      const now = new Date();
      
      try {
        // Get latest team photo completion
        supabase
        .from('task_completions')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('task_type', 'team_photo')
        .order('completed_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data?.[0]) {
            const lastCompletion = new Date(data[0].completed_at);
            const nextAllowed = new Date(lastCompletion);
            nextAllowed.setDate(nextAllowed.getDate() + 1);
            nextAllowed.setHours(0, 0, 0, 0);

            const timeDiff = nextAllowed.getTime() - now.getTime();
            setCanPostTeamPhoto(timeDiff <= 0);
            setTimeLeft(Math.max(0, timeDiff));
          } else {
            setCanPostTeamPhoto(true);
            setTimeLeft(0);
          }
        })
        .catch(error => {
          // Ignore 406 errors and treat as no completions
          if (error.code !== 'PGRST116') {
            console.error('Error checking team photo status:', error);
          }
          setCanPostTeamPhoto(true);
          setTimeLeft(0);
        });
      } catch (error) {
        console.error('Error in updateCooldown:', error);
        setCanPostTeamPhoto(true);
        setTimeLeft(0);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [user.id]);

  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return null;
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}ч ${minutes}м`;
  };

  const handleTeamPhotoUpload = async (file: File) => {
    try {
      hapticFeedback('light');

      if (!canPostTeamPhoto) {
        showNotification({
          title: 'Задание уже выполнено',
          message: 'Подождите до завтра, чтобы опубликовать новое фото',
          type: 'warning'
        });
        return;
      }

      // Compress image
      const compressedImage = await compressImage(file);
      
      // Generate unique filename
      const ext = file.name.split('.').pop();
      const filename = `team-activity-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filename, compressedImage);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(uploadData.path);

      // Create message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          text: '📸 Фото командной активности\n#КоманднаяАктивность',
          type: 'image',
          image_url: publicUrl,
          created_at: new Date().toISOString()
        });

      if (messageError) throw messageError;

      // Create task completion
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          user_id: user.id,
          task_type: 'team_photo',
          points_awarded: 10, // Always award 10 points
          metadata: {
            image_url: publicUrl,
            completed_at: new Date().toISOString()
          }
        });

      if (completionError) throw completionError;

      // Award points
      const { error: pointsError } = await supabase.rpc('increment_points', {
        user_id: user.id,
        amount: 10, // Always award 10 points
        reason: 'team_photo'
      });

      if (pointsError) throw pointsError;

      hapticFeedback('success');
      showNotification({
        title: 'Фото загружено',
        message: 'Фото командной активности опубликовано (+10 баллов)',
        type: 'success'
      });

      if (onPhotoUpload) {
        onPhotoUpload();
      }

    } catch (error) {
      console.error('Error uploading team photo:', error);
      hapticFeedback('error');
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить фото',
        type: 'error'
      });
    }
  };

  const handleParticipantsPhotoUpload = async (file: File) => {
    try {
      hapticFeedback('light');
      
      // Check if task is already completed
      const { data } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_type', 'participants_photo')
        .eq('metadata->first_time', true)
        .limit(1);

      if (data?.length) {
        showNotification({
          title: 'Задание уже выполнено',
          message: 'Вы уже получили баллы за фото с участниками',
          type: 'warning'
        });
        return;
      }
      
      // Compress image
      const compressedImage = await compressImage(file);
      
      // Generate unique filename
      const ext = file.name.split('.').pop();
      const filename = `participants-photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filename, compressedImage);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(uploadData.path);

      // Create message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          text: '📸 Фото с участниками\n#ФотоСУчастниками',
          type: 'image',
          image_url: publicUrl,
          created_at: new Date().toISOString()
        });

      if (messageError) throw messageError;

      // Create task completion
      setHasCompletedParticipantsPhoto(true);
      
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          user_id: user.id,
          task_type: 'participants_photo',
          points_awarded: 10,
          metadata: {
            image_url: publicUrl,
            first_time: true
          },
          completed_at: new Date().toISOString()
        });

      if (completionError) throw completionError;

      // Award points
      const { error: pointsError } = await supabase.rpc('increment_points', {
        user_id: user.id,
        amount: 10,
        reason: 'participants_photo'
      });

      if (pointsError) throw pointsError;

      hapticFeedback('success');
      showNotification({
        title: 'Фото загружено',
        message: 'Фото с участниками опубликовано (+10 баллов)',
        type: 'success'
      });

      if (onPhotoUpload) {
        onPhotoUpload();
      }

    } catch (error) {
      console.error('Error uploading participants photo:', error);
      hapticFeedback('error');
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить фото',
        type: 'error'
      });
    }
  };

  return (
    <div className="mt-8">
      <div className="card p-4 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-indigo-500/10 relative overflow-hidden">
        {/* Decorative background icons */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          {/* Top row */}
          <div className="absolute -right-2 -top-2 transform rotate-12">
            <Camera className="w-12 h-12" />
          </div>
          <div className="absolute right-8 top-1 transform rotate-6">
            <Users className="w-10 h-10" />
          </div>
          <div className="absolute right-16 -top-1 transform -rotate-12">
            <Camera className="w-8 h-8" />
          </div>
          
          {/* Middle row */}
          <div className="absolute left-1/4 top-1/2 transform -translate-y-1/2 rotate-6">
            <Users className="w-10 h-10" />
          </div>
          <div className="absolute right-1/4 top-1/2 transform -translate-y-1/2 -rotate-12">
            <Camera className="w-12 h-12" />
          </div>
          
          {/* Bottom row */}
          <div className="absolute -left-2 -bottom-2 transform -rotate-12">
            <Camera className="w-10 h-10" />
          </div>
          <div className="absolute left-8 bottom-1 transform rotate-12">
            <Users className="w-8 h-8" />
          </div>
          <div className="absolute left-16 -bottom-1 transform -rotate-6">
            <Camera className="w-10 h-10" />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Camera className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-medium text-indigo-300">Фото активности</h3>
            <p className="text-sm text-slate-400">
              Делитесь фотографиями и зарабатывайте баллы
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* Team Activity Photo */}
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className={`p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg transition-all ${
              canPostTeamPhoto 
                ? 'cursor-pointer hover:bg-indigo-500/20 hover:scale-[1.02]' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleTeamPhotoUpload(file);
              }}
            />
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Camera className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-300 text-sm mb-0.5">Командная активность</h4>
                <p className="text-xs text-slate-400">
                  +10 баллов за каждый день
                </p>
                {!canPostTeamPhoto && timeLeft > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Следующее фото через: {formatTimeLeft(timeLeft)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Participants Photo */}
          <div 
            onClick={() => participantsPhotoInputRef.current?.click()} 
            className={`p-3 ${
              hasCompletedParticipantsPhoto
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-purple-500/10 border border-purple-500/20 cursor-pointer hover:bg-purple-500/20 hover:scale-[1.02]'
            } rounded-lg transition-all relative`}
          >
            {hasCompletedParticipantsPhoto && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              </div>
            )}
            <input
              type="file"
              ref={participantsPhotoInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleParticipantsPhotoUpload(file);
              }}
            />
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-purple-300 text-sm mb-0.5">Фото с участниками</h4>
                <p className="text-xs text-slate-400">
                  {hasCompletedParticipantsPhoto 
                    ? 'Задание выполнено' 
                    : '+10 баллов за первое фото'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}