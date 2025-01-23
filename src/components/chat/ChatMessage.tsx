import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Heart, ZoomIn, Reply } from 'lucide-react';
import { formatDate } from '../../utils/dateFormatter';
import { useMessageLikes } from '../../hooks/useMessageLikes';
import { hapticFeedback } from '../../utils/telegram';
import { ImageViewer } from '../ImageViewer';

interface ReplyToMessage {
  id: string;
  text: string;
  user: {
    first_name: string;
  };
}

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    type: string;
    image_url?: string;
    likes: number;
    liked_by: string[];
    is_from_telegram: boolean;
    sender_name?: string;
    reply_to?: ReplyToMessage;
    user: {
      id: string;
      first_name: string;
      last_name?: string;
      photo_url?: string;
    };
  };
  isCurrentUser: boolean;
  currentUserId: string;
  onReply: (message: any) => void;
}

export function ChatMessage({ message, isCurrentUser, currentUserId, onReply }: ChatMessageProps) {
  const { handleLike, isLiking, currentUserId: hookUserId, optimisticLikes } = useMessageLikes();
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const messageDate = message.created_at ? new Date(message.created_at) : null;
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Use optimistic state if available, otherwise use server state
  const optimisticState = optimisticLikes[message.id];
  const effectiveUserId = currentUserId || hookUserId;
  const isLiked = optimisticState ? optimisticState.liked : message.liked_by?.includes(effectiveUserId);
  const likeCount = optimisticState ? optimisticState.count : message.likes || 0;

  const onLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!effectiveUserId) {
      showNotification({
        title: 'Ошибка',
        message: 'Необходимо авторизоваться',
        type: 'error'
      });
      return;
    }
    const success = await handleLike(message.id);
    if (success) {
      hapticFeedback('medium');
    }
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReply({
      id: message.id,
      text: message.text,
      user: {
        first_name: message.user.first_name
      }
    });
    hapticFeedback('light');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 group`}
    >
      {!isCurrentUser && (
        <div className="flex-shrink-0 mr-2">
          {message.user.photo_url ? (
            <img
              src={message.user.photo_url}
              alt={message.user.first_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
              <span className="text-sm font-medium text-emerald-light">
                {message.user.first_name[0]}
              </span>
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[85%] ${isCurrentUser ? 'order-1' : 'order-2'}`}>
        {!isCurrentUser && (
          <div className="text-sm font-medium text-emerald-light mb-1">
            {message.user.first_name} {message.user.last_name}
            {message.is_from_telegram && (
              <span className="ml-2 text-xs text-slate-400">(из Telegram)</span>
            )}
          </div>
        )}
        
        <div 
          id={`message-${message.id}`}
          className={`rounded-2xl p-3 ${
            isCurrentUser
              ? 'bg-emerald-500/20 text-emerald-light'
              : 'bg-slate-800/50 text-slate-200'
          }`}
        >
          {message.reply_to && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                const element = document.getElementById(`message-${message.reply_to.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element.classList.add('highlight-message');
                  setTimeout(() => element.classList.remove('highlight-message'), 2000);
                }
              }}
              className="mb-2 p-2 rounded-lg bg-slate-900/50 border-l-2 border-emerald-500/50 cursor-pointer hover:bg-slate-800/50"
            >
              <div className="text-xs text-emerald-300 mb-1">
                {message.reply_to.user.first_name}
              </div>
              <div className="text-xs text-slate-400">
                {message.reply_to.text.substring(0, 20)}
                {message.reply_to.text.length > 20 && '...'}
                {message.reply_to.image_url && (
                  <div className="flex items-center gap-1 mt-1">
                    <img 
                      src={message.reply_to.image_url} 
                      alt="" 
                      className="w-6 h-6 rounded object-cover"
                    />
                    <span className="text-slate-500">Изображение</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {message.image_url && !imageError && (
            <div className="relative mb-2">
              <div 
                className={`relative cursor-zoom-in transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={() => setShowImageViewer(true)}
              >
                <img
                  ref={imageRef}
                  src={message.image_url}
                  alt={message.text || "Изображение"}
                  className="rounded-lg max-w-full max-h-[300px] w-auto h-auto object-contain bg-slate-900/50 select-none"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none">
                  <ZoomIn className="w-6 h-6 text-white" />
                </div>
              </div>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-slate-900/50 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-emerald-light/30 border-t-emerald-light rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
          
          {message.text && message.text !== '📸 Фото командной активности' && message.text !== '📸 Фото с участниками' && (
            <p className="text-sm break-words whitespace-pre-wrap max-w-full">
              {message.text}
            </p>
          )}

          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-slate-400">
              {messageDate ? formatDate(messageDate.toISOString()) : ''}
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReply}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors bg-slate-800/50 text-slate-300 hover:bg-slate-800`}
              >
                <Reply className="w-3 h-3" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLikeClick}
                disabled={isLiking}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  isLiked 
                    ? 'bg-red-500/20 text-red-300' 
                    : 'bg-slate-800/50 text-slate-300 hover:bg-red-500/20 hover:text-red-300'
                }`}
              >
                <Heart 
                  className={`w-3 h-3 ${isLiking ? 'animate-pulse' : ''}`}
                  fill={isLiked ? 'currentColor' : 'none'}
                />
                {likeCount > 0 && (
                  <span className="absolute -bottom-1 -right-1 text-[10px] font-medium bg-slate-800/90 text-slate-300 px-1 rounded-full min-w-[14px] text-center">
                    {likeCount}
                  </span>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showImageViewer && message.image_url && (
          <ImageViewer
            key={message.image_url}
            src={message.image_url}
            alt={message.text}
            onClose={() => setShowImageViewer(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}