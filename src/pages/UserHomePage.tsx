import React from 'react';
import { TelegramUser } from '../types';
import { useProfile } from '../hooks/useProfile';
import { UserProfile } from '../components/UserProfile';
import { WelcomeBanner } from '../components/WelcomeBanner';
import { CombinedMessagesSlider } from '../components/slider/CombinedMessagesSlider';
import { ImageSlider } from '../components/slider/ImageSlider';
import { useNavigate } from 'react-router-dom';
import { Users, Book } from 'lucide-react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

interface UserHomePageProps {
  currentUser: TelegramUser | null;
}

export function UserHomePage({ currentUser }: UserHomePageProps) {
  const { profile, showWelcomeConfetti } = useProfile(currentUser);
  const navigate = useNavigate();

  if (!profile) {
    return (
      <div className="card p-6">
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
      <WelcomeBanner />

      {/* User Profile */}
      <UserProfile profile={profile} />

      {/* Quick Access Banners */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            icon: <Book className="w-6 h-6 text-emerald-400" />,
            title: 'Правила',
            subtitle: 'Узнать подробнее',
            onClick: () => navigate('/rules')
          },
          {
            icon: <Users className="w-6 h-6 text-emerald-400" />,
            title: 'Участники',
            subtitle: 'Все спикеры',
            onClick: () => navigate('/participants')
          }
        ].map(({ icon, title, subtitle, onClick }, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="card p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 hover:from-emerald-500/20 hover:to-emerald-600/20 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                {icon}
              </div>
              <div className="text-left">
                <span className="text-emerald-300 font-medium block">{title}</span>
                <span className="text-sm text-emerald-300/70">{subtitle}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Image Slider */}
      <ImageSlider />

      {/* Combined Messages Slider */}
      <CombinedMessagesSlider />

    </div>
  );
}