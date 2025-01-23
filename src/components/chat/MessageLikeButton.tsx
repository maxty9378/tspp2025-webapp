// src/components/chat/MessageLikeButton.tsx
import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMessageLikes } from '../../hooks/useMessageLikes';

interface MessageLikeButtonProps {
  messageId: string;
  currentUserId: string;
  likedBy: string[];
}

export function MessageLikeButton({ messageId, currentUserId, likedBy }: MessageLikeButtonProps) {
  const { handleLike, isLiking } = useMessageLikes();
  const isLiked = likedBy?.includes(currentUserId);
  const likesCount = likedBy?.length || 0;

  return (
    <motion.button
      onClick={() => handleLike(messageId, currentUserId)}
      disabled={isLiking}
      whileTap={{ scale: 0.9 }}
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
        isLiked 
          ? 'bg-red-500/20 text-red-300' 
          : 'bg-slate-800/50 text-slate-300 hover:bg-red-500/20 hover:text-red-300'
      }`}
    >
      <Heart
        className={`w-3 h-3 ${isLiking ? 'animate-pulse' : ''}`}
        fill={isLiked ? 'currentColor' : 'none'}
      />
      <span>{likesCount}</span>
    </motion.button>
  );
}
