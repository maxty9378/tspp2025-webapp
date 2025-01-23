import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useImageLikes } from '../../hooks/useImageLikes';

interface ImageSlideProps {
  imageUrl: string;
  messageId: string;
  likes: number;
  likedBy: string[];
  onLike: () => void;
}

export function ImageSlide({ imageUrl, messageId, likes, likedBy, onLike }: ImageSlideProps) {
  const { handleLike, isLiking, currentUserId } = useImageLikes();
  const isLiked = likedBy.includes(currentUserId || '');

  const onLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await handleLike(messageId, likes, likedBy);
    if (success) {
      onLike();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0"
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 z-10" />
      
      {/* Image */}
      <img
        src={imageUrl}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      <div className="absolute right-4 top-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLikeClick}
          disabled={isLiking}
          className={`relative w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm border ${
            isLiked 
              ? 'bg-red-500/20 border-red-500/30' 
              : 'bg-black/20 border-white/10'
          }`}
        >
          <Heart 
            className={`w-4 h-4 ${isLiked ? 'text-red-400' : 'text-white/80'}`}
            fill={isLiked ? 'currentColor' : 'none'}
          />
          {likes > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 text-[10px] font-medium bg-slate-800/90 text-slate-300 px-1 rounded-full min-w-[14px] text-center">
              {likes}
            </span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}