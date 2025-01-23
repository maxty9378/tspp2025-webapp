import React from 'react';
import { User, Heart, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserProfile as UserProfileType } from '../types';

interface UserProfileProps {
  profile: UserProfileType;
  className?: string;
}

export function UserProfile({ profile, className = '' }: UserProfileProps) {
  return (
    <motion.div
      className={`card p-4 backdrop-blur-lg bg-white/10 border border-emerald-500/20 rounded-2xl shadow-lg ${className}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-4">
        {/* User Avatar */}
        {profile.photo_url ? (
          <img
            src={profile.photo_url}
            alt={profile.first_name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/20"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <User className="w-8 h-8 text-emerald-500/70" />
          </div>
        )}

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent truncate">
            {profile.first_name} {profile.last_name}
          </h1>

          {profile.username && (
            <p className="text-sm text-slate-400 mb-2">
              {profile.username.startsWith('@') ? profile.username : `@${profile.username}`}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded-full shadow-inner">
              <span>{profile.points}</span>
              <span>баллов</span>
            </div>

            {profile.total_coins_earned > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-300 px-2 py-1 rounded-full shadow-inner">
                <Coins className="w-3.5 h-3.5" />
                <span>{profile.total_coins_earned}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-red-500/10 text-red-300 px-2 py-1 rounded-full shadow-inner">
              <Heart className="w-3.5 h-3.5" />
              <span>{profile.liked_by?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
