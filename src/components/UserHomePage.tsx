import React from 'react';
import { TelegramUser } from '../types';
import { useProfile } from '../hooks/useProfile';
import { UserProfile } from '../components/UserProfile';
import { SuggestionBox } from '../components/SuggestionBox';
import { MazeGameDisplay } from '../components/MazeGameDisplay';
import { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Book } from 'lucide-react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { LoadingScreen } from '../components/LoadingScreen';

// Lazy load components that require data fetching
const WelcomeBanner = lazy(() => import('../components/WelcomeBanner').then(module => ({ default: module.WelcomeBanner })));
const ImageSlider = lazy(() => import('../components/slider/ImageSlider'));
const CombinedMessagesSlider = lazy(() => import('../components/slider/CombinedMessagesSlider'));
import { DailyTask } from '../components/DailyTask';

interface UserHomePageProps {
  currentUser: TelegramUser | null;
}

export function UserHomePage({ currentUser }: UserHomePageProps) {
  const { profile, showWelcomeConfetti } = useProfile(currentUser);
  const navigate = useNavigate();

  if (!profile) {
    return (
      <div className="card p-6 animate-pulse">
        <p className="text-slate-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showWelcomeConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      {/* Welcome Banner */}
      <Suspense fallback={<div className="h-[280px] card animate-pulse" />}>
        <WelcomeBanner />
      </Suspense>

      {/* User Profile */}
      <UserProfile profile={profile} className="animate-fadeIn" />

      {/* Quick Access Banners */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/rules')}
          className="card p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 hover:from-emerald-500/20 hover:to-emerald-600/20 transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Book className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <span className="text-emerald-300 font-medium block">Правила</span>
              <span className="text-sm text-emerald-300/70">Узнать подробнее</span>
            </div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/participants')}
          className="card p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 hover:from-emerald-500/20 hover:to-emerald-600/20 transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <span className="text-emerald-300 font-medium block">Участники</span>
              <span className="text-sm text-emerald-300/70">Все спикеры</span>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Image Slider */}
      <Suspense fallback={<div className="h-[180px] card animate-pulse" />}>
        <ImageSlider />
      </Suspense>

      {/* Combined Messages Slider */}
      <Suspense fallback={<div className="h-[200px] card animate-pulse" />}>
        <CombinedMessagesSlider />
      </Suspense>

      {/* Daily Task */}
      <DailyTask user={profile} />

    </div>
  );
}