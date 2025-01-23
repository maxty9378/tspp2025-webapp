import React from 'react';
import { Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserProfile } from '../../types';
import { LikesProgress } from './LikesProgress';

interface CoinsTaskProps {
  user: UserProfile;
  hasEarnedCoins: boolean;
  onClick: () => void;
}

export function CoinsTask({ user, hasEarnedCoins, onClick }: CoinsTaskProps) {
  const coinsMultiplier = Math.floor(user.total_coins_earned / 1000) + 1;

  return (
    <div className="space-y-4">
      <motion.div 
        onClick={onClick} 
        className={`card p-4 ${
          hasEarnedCoins 
            ? 'bg-emerald-500/10 border border-emerald-500/20' 
            : 'bg-slate-800/50 border border-slate-700/30 cursor-pointer hover:bg-slate-800/70 hover:scale-[1.02] transition-all duration-200'
        } transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            hasEarnedCoins ? 'bg-emerald-500/20' : 'bg-slate-700/50'
          }`}>
            <Coins className={`w-4 h-4 ${
              hasEarnedCoins ? 'text-emerald-400' : 'text-slate-400'
            }`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className={`font-medium ${
                hasEarnedCoins ? 'text-emerald-300' : 'text-slate-300'
              }`}>
                Заработать DOIRP Coins
              </h4>
              {hasEarnedCoins && (
                <div className="text-sm text-emerald-300">
                  x{coinsMultiplier} множитель
                </div>
              )}
            </div>
            <p className="text-sm text-slate-400">
              {hasEarnedCoins 
                ? `Вы заработали ${user.total_coins_earned} монет` 
                : 'Нажмите чтобы заработать DOIRP Coins'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Daily Likes Task */}
      <LikesProgress user={user} />
    </div>
  );
}