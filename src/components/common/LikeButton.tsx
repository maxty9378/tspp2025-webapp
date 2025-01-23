import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface LikeButtonProps {
  count: number;
  isLiked: boolean;
  onLike: () => void;
  isLoading?: boolean;
}

export function LikeButton({ count, isLiked, onLike, isLoading }: LikeButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onLike}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
        isLiked 
          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
      }`}
    >
      <Heart 
        className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`}
        fill={isLiked ? 'currentColor' : 'none'}
      />
      <span className="text-xs font-medium">{count || 0}</span>
    </motion.button>
  );
}