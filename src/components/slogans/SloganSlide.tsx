import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { formatDate } from '../../utils/dateFormatter';
import { useMessageLikes } from '../../hooks/useMessageLikes';

interface SloganSlideProps {
  slogan: {
    id: string;
    user: {
      first_name: string;
      last_name?: string;
      photo_url?: string;
    };
    text: string;
    created_at: string;
    likes: number;
    liked_by: string[];
  };
  onLike: () => void;
}

export function SloganSlide({ slogan, onLike }: SloganSlideProps) {
  const { handleLike, isLiking, currentUserId } = useMessageLikes();
  const isLiked = slogan.liked_by?.includes(currentUserId || '');

  const onLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await handleLike(slogan.id, slogan.likes, slogan.liked_by);
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
          {slogan.user.photo_url ? (
            <img
              src={slogan.user.photo_url}
              alt={slogan.user.first_name}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <span className="text-sm font-medium text-emerald-light">
                {slogan.user.first_name[0]}
              </span>
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-emerald-light">
              {slogan.user.first_name} {slogan.user.last_name}
            </div>
            <div className="text-xs text-slate-400">
              {formatDate(slogan.created_at)}
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

      <p className="text-sm text-slate-300 line-clamp-3">
        {slogan.text}
      </p>

      <div className="absolute bottom-4 right-4 text-xs text-slate-400">
        {slogan.likes} лайков
      </div>
    </motion.div>
  );
}