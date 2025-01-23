import React, { useState } from 'react';
import { Image, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { showNotification } from '../../utils/notifications';
import { compressImage } from '../../utils/imageOptimizer';
import { hapticFeedback } from '../../utils/telegram';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
}

export function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
    
    if (!currentUserId) {
      showNotification({
        title: 'Ошибка',
        message: 'Необходимо авторизоваться',
        type: 'error'
      });
      return;
    }

    try {
      setUploading(true);
      hapticFeedback('light');

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Файл слишком большой (максимум 5MB)');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Поддерживаются только изображения');
      }

      // Compress image before upload
      const compressedImage = await compressImage(file);
      
      // Generate unique filename
      const ext = file.name.split('.').pop();
      const filename = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filename, compressedImage);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(data.path);

      onUpload(publicUrl);
      hapticFeedback('success');

    } catch (error) {
      console.error('Upload error:', error);
      hapticFeedback('error');
      showNotification({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось загрузить изображение',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.label
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="p-2 rounded-full hover:bg-slate-800/50 cursor-pointer"
    >
      {uploading ? (
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      ) : (
        <Image className="w-5 h-5 text-slate-400" />
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />
    </motion.label>
  );
}