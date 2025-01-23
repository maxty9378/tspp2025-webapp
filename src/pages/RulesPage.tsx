import React, { useEffect } from 'react';
import { Book, MessageSquare, Camera, Trophy, Heart, Star, Gift } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface RewardRule {
  id: string;
  title: string;
  points: number;
  description: string;
  icon: typeof MessageSquare;
  color: string;
}

const REWARD_RULES: RewardRule[] = [
  {
    id: 'greeting',
    title: 'Приветствие или цитата дня',
    points: 10,
    description: 'Представьтесь или поделитесь вдохновляющей цитатой',
    icon: MessageSquare,
    color: 'emerald'
  },
  {
    id: 'speaker_photo',
    title: 'Фото со спикером',
    points: 50,
    description: 'Опубликуйте фото со спикером',
    icon: Camera,
    color: 'blue'
  },
  {
    id: 'team_photo',
    title: 'Командное фото',
    points: 20,
    description: 'Опубликуйте фото с командой',
    icon: Camera,
    color: 'indigo'
  },
  {
    id: 'success_story',
    title: 'История успеха',
    points: 30,
    description: 'Поделитесь своей историей успеха',
    icon: Trophy,
    color: 'amber'
  },
  {
    id: 'likes',
    title: 'Лайки',
    points: 10,
    description: 'Поставьте 10 лайков другим участникам',
    icon: Heart,
    color: 'rose'
  },
  {
    id: 'surveys',
    title: 'Тесты',
    points: 40,
    description: 'Пройдите тесты по итогам дня',
    icon: Star,
    color: 'purple'
  }
];

export function RulesPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        navigate('/');
        if (tg.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('light');
        }
      });
    }

    return () => {
      if (tg?.BackButton) {
        tg.BackButton.offClick();
        tg.BackButton.hide();
      }
    };
  }, [navigate]);

  return (
    <div className="space-y-6">
      <PageHeader title="Правила" icon={Book}>
        <p className="text-emerald-primary/80 text-sm mt-1">
          Друзья, активно участвуя в КП, вы сможете получать баллы и обменивать их на призы. Мы собрали для вас очень привлекательный призовой фонд!
        </p>
      </PageHeader>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* General Rules */}
        <div className="card p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 border border-emerald-500/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">
                Система баллов
              </h2>
              <p className="text-emerald-300/70">Зарабатывайте баллы за активное участие</p>
            </div>
          </div>
        </div>

        {/* Reward Rules Grid */}
        <div className="grid gap-3">
          {REWARD_RULES.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-3 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:from-slate-800/70 hover:to-slate-900/70 transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg bg-${rule.color}-500/20 flex items-center justify-center shrink-0`}>
                  <rule.icon className={`w-4 h-4 text-${rule.color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-medium text-${rule.color}-300 truncate`}>
                      {rule.title}
                    </h3>
                    <span className={`shrink-0 text-sm font-medium bg-${rule.color}-500/20 text-${rule.color}-300 px-2 py-0.5 rounded-full`}>
                      +{rule.points} баллов
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {rule.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default RulesPage;