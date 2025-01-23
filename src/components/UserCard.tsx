import React, { useState, useRef } from 'react';
import { User, Shield, Heart, MessageSquare, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';
import { UserProfile } from '../types';

interface UserCardProps {
  user: UserProfile;
  isCurrentUser?: boolean;
  currentUserIsAdmin?: boolean;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  rotation: number;
}

export function UserCard({ user, isCurrentUser, currentUserIsAdmin }: UserCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(user.liked_by?.length || 0);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const heartIdCounter = useRef(0);
  const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();

  const addFloatingHearts = (x: number, y: number) => {
    if (!cardRef.current) return;

    const newHearts = Array.from({ length: 8 }, () => ({
      id: heartIdCounter.current++,
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      rotation: Math.random() * 360
    }));

    setFloatingHearts(prev => [...prev, ...newHearts]);

    setTimeout(() => {
      setFloatingHearts(hearts => hearts.filter(heart => !newHearts.find(h => h.id === heart.id)));
    }, 1000);
  };

  const handleLike = async (event: React.MouseEvent) => {
    if (!currentUserId || isCurrentUser || isLiking || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setIsLiking(true);
    addFloatingHearts(x, y);

    try {
      const { data, error } = await supabase
        .rpc('add_like', {
          target_user_id: user.id,
          liker_id: currentUserId
        });

      if (error) throw error;

      setLikeCount(data.total_likes);

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
      }

      showNotification({
        title: 'Успешно',
        message: 'Лайк поставлен',
        type: 'success'
      });

    } catch (error) {
      console.error('Error liking user:', error);
      showNotification({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось поставить лайк',
        type: 'error'
      });
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div ref={cardRef} className="relative">
      <motion.div
        className={`card p-4 ${isCurrentUser ? 'ring-2 ring-emerald-primary' : 'hover:bg-slate-800/70'}`}
        whileHover={!isCurrentUser ? { scale: 1.02 } : undefined}
        whileTap={!isCurrentUser ? { scale: 0.98 } : undefined}
        onClick={!isCurrentUser && !currentUserIsAdmin ? handleLike : undefined}
      >
        <AnimatePresence>
          {floatingHearts.map(heart => (
            <motion.div
              key={heart.id}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 0.5, y: -100, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none z-50"
              style={{
                left: `${heart.x}px`,
                top: `${heart.y}px`,
                transform: `rotate(${heart.rotation}deg)`
              }}
            >
              <Heart className="w-6 h-6 text-red-300" fill="currentColor" />
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex items-center gap-4">
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.first_name}
              className="w-16 h-16 rounded-[1.25rem] object-cover ring-2 ring-emerald-primary/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-[1.25rem] bg-emerald-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-emerald-primary/70" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-semibold text-lg text-slate-200">
                {user.first_name} {user.last_name}
              </h3>
              {user.is_admin && (
                <Shield className="w-4 h-4 text-emerald-primary" />
              )}
            </div>
            
            {user.username && (
              <p className="text-slate-400">
                {user.username.startsWith('@') ? user.username : `@${user.username}`}
              </p>
            )}
            
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="text-sm bg-emerald-primary/10 text-emerald-light px-2 py-1 rounded-full">
                {user.points} баллов
              </div>
              
              {user.total_coins_earned > 0 && (
                <div className="text-sm bg-amber-500/10 text-amber-300 px-2 py-1 rounded-full flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  {user.total_coins_earned}
                </div>
              )}
              
              <div className={`text-sm px-2 py-1 rounded-full flex items-center gap-1 ${
                isLiking ? 'bg-red-500/40 text-red-300' : 'bg-red-500/20 text-red-300'
              }`}>
                <Heart 
                  className={`w-3 h-3 transition-transform duration-300 ${
                    isLiking ? 'scale-150' : ''
                  }`}
                  fill="currentColor"
                />
                {likeCount}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}