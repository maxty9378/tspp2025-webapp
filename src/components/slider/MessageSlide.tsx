import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Quote, MessageSquare, BookOpen } from 'lucide-react';
import { formatDate } from '../../utils/dateFormatter';
import { useMessageLikes } from '../../hooks/useMessageLikes';

interface MessageSlideProps {
  message: {
    id: string;
    user: {
      id: string;
      first_name: string;
      last_name?: string;
      photo_url?: string;
    };
    text: string;
    type: string;
    created_at: string;
    likes: number;
    liked_by: string[];
  };
  onLike: () => void;
}

export function MessageSlide({ message, onLike }: MessageSlideProps) {
  const { handleLike, isLiking, currentUserId, optimisticLikes } = useMessageLikes();
  
  // Use optimistic state if available, otherwise use server state
  const optimisticState = optimisticLikes[message.id];
  const isLiked = optimisticState ? optimisticState.liked : message.liked_by?.includes(currentUserId);
  const likeCount = optimisticState ? optimisticState.count : message.likes || 0;

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await handleLike(message.id);
    if (success) {
      onLike();
    }
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'greeting':
        return {
          label: 'Приветствие',
          icon: <MessageSquare className="w-3 h-3" />,
          styles: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        };
      case 'quote':
        return {
          label: 'Цитата дня',
          icon: <Quote className="w-3 h-3" />,
          styles: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
      case 'slogan':
        return {
          label: 'Слоган',
          icon: <MessageSquare className="w-3 h-3" />,
          styles: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
      case 'practice':
        return {
          label: 'Опыт из практики',
          icon: <BookOpen className="w-3 h-3" />,
          styles: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };
      case 'mistake':
        return {
          label: 'Важный урок',
          icon: <BookOpen className="w-3 h-3" />,
          styles: 'bg-red-500/20 text-red-300 border-red-500/30'
        };
      default:
        return {
          label: type,
          icon: <MessageSquare className="w-3 h-3" />,
          styles: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
        };
    }
  };

  const typeInfo = getTypeInfo(message.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {message.user.photo_url ? (
            <img
              src={message.user.photo_url}
              alt={message.user.first_name}
              className="w-7 h-7 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <span className="text-sm font-medium">
                {message.user.first_name[0]}
              </span>
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-emerald-light">
              {message.user.first_name} {message.user.last_name}
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${typeInfo.styles}`}>
                {typeInfo.icon}
                {typeInfo.label}
              </span>
              <span className="text-xs text-slate-400">
                {formatDate(message.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLikeClick}
          disabled={isLiking}
          className={`relative w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm border ${
            isLiked 
              ? 'bg-red-500/20 border-red-500/30' 
              : 'bg-black/20 border-white/10'
          }`}
        >
          <Heart 
            className={`w-3.5 h-3.5 ${isLiked ? 'text-red-400' : 'text-white/80'}`}
            fill={isLiked ? 'currentColor' : 'none'}
          />
          {likeCount > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 text-[10px] font-medium bg-slate-800/90 text-slate-300 px-1 rounded-full min-w-[14px] text-center">
              {likeCount}
            </span>
          )}
        </motion.button>
      </div>

      <p className="text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg mb-1">
        {message.text}
      </p>
    </motion.div>
  );
}