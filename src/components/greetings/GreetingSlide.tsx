import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { formatDate } from '../../utils/dateFormatter';
import { useMessageLikes } from '../../hooks/useMessageLikes';

interface GreetingSlideProps {
  message: {
    id: string;
    user: {
      first_name: string;
      last_name?: string;
      photo_url?: string;
    };
    text: string;
    type: 'greeting' | 'quote';
    created_at: string;
    likes: number;
    liked_by: string[];
  };
  onLike: () => void;
}

export function GreetingSlide({ message, onLike }: GreetingSlideProps) {
  const { handleLike, isLiking, currentUserId } = useMessageLikes();
  const isLiked = message.liked_by?.includes(currentUserId || '');

  const onLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await handleLike(message.id, message.likes, message.liked_by);
    if (success) {
      onLike();
    }
  };

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
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <span className="text-sm font-medium text-emerald-light">
                {message.user.first_name[0]}
              </span>
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-emerald-light">
              {message.user.first_name} {message.user.last_name}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full">
                {message.type === 'greeting' ? 'Приветствие' : 'Цитата дня'}
              </span>
              <span className="text-xs text-slate-400">
                {formatDate(message.created_at)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onLikeClick}
          disabled={isLiking}
          className={`p-2 rounded-full backdrop-blur-sm border ${
            isLiked 
              ? 'bg-red-500/20 border-red-500/30' 
              : 'bg-black/20 border-white/10'
          }`}
        >
          <Heart 
            className={`w-4 h-4 ${isLiked ? 'text-red-400' : 'text-white/80'}`}
            fill={isLiked ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <p className="text-sm text-slate-300 line-clamp-4">
        {message.text}
      </p>

      <div className="absolute bottom-4 right-4 text-xs text-slate-400">
        {message.likes} лайков
      </div>
    </motion.div>
  );
}