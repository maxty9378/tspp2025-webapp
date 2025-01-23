import React from 'react';
import { Heart } from 'lucide-react';

interface LikeCounterProps {
  count: number;
  isLiked: boolean;
  onLike: () => void;
  isLoading?: boolean;
}

export function LikeCounter({ count, isLiked, onLike, isLoading }: LikeCounterProps) {
  return (
    <button
      onClick={onLike}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
        isLiked 
          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
      }`}
    >
      <Heart 
        className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`}
        fill={isLiked ? 'currentColor' : 'none'}
      />
      <span className="text-sm">{count}</span>
    </button>
  );
}