import React, { useState, useRef, useEffect } from 'react';
import { Send, Image } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticFeedback } from '../../utils/telegram';
import { showNotification } from '../../utils/notifications';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../utils/imageOptimizer';

interface ChatInputProps {
  onSend: (text: string, type: 'text' | 'image', imageUrl?: string) => void;
  className?: string;
}

export function ChatInput({ onSend, className = '' }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [systemPadding, setSystemPadding] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    // Add extra padding on Android
    setSystemPadding(tg.platform === 'android' ? 48 : 0);

    // Handle keyboard appearance
    const handleResize = () => {
      const initialHeight = window.innerHeight;
      const currentHeight = window.innerHeight;
      const isKeyboardVisible = initialHeight > currentHeight;
      setKeyboardOpen(isKeyboardVisible);

      if (textareaRef.current) {
        // Auto-adjust height
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        
        // Ensure proper keyboard behavior
        if (tg.isExpanded) {
          tg.expand();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = () => {
    if (!message.trim() || isComposing) return;
    
    // Prevent sending empty or whitespace-only messages
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    
    // Add haptic feedback before sending
    hapticFeedback('light');
    
    onSend(trimmedMessage, 'text');
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
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

      onSend('', 'image', publicUrl);
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
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div 
      className={`border-t border-slate-700/30 bg-gradient-to-b from-slate-900/90 to-slate-800/90 backdrop-blur-lg ${
        keyboardOpen ? 'translate-y-[-60px]' : ''
      }`}
    >
      <div 
        className="flex items-center gap-3 px-4 py-3" 
        style={{ 
          paddingBottom: `${systemPadding + 16}px`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 rounded-full hover:bg-slate-800/50 cursor-pointer"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-200 rounded-full animate-spin" />
          ) : (
            <Image className="w-5 h-5 text-slate-400" />
          )}
        </motion.button>
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue.length <= 1000) {
              setMessage(newValue);
              // Auto-adjust height
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }
          }}
          onKeyDown={handleKeyPress}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onFocus={() => {
            // Ensure proper keyboard behavior
            const tg = window.Telegram?.WebApp;
            if (tg?.isExpanded) {
              tg.expand();
            }
          }}
          onBlur={() => {
            // Reset scroll position on blur
            window.scrollTo(0, 0);
          }}
          placeholder="Написать сообщение..."
          className="flex-1 bg-slate-800/40 text-slate-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-h-[36px] max-h-[120px] resize-none appearance-none"
          rows={1}
          style={{
            overflowY: 'auto',
            lineHeight: '1.5',
            WebkitOverflowScrolling: 'touch',
            WebkitAppearance: 'none'
          }}
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={!message.trim() || isComposing}
          className={`p-2 rounded-full transition-colors ${
            message.trim() && !isComposing
              ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-light hover:from-emerald-500/30 hover:to-emerald-600/30'
              : 'bg-slate-800/50 text-slate-400'
          }`}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}