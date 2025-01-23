import React, { useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { DailyTask } from '../components/DailyTask';
import { motion } from 'framer-motion';
import { useProfile } from '../hooks/useProfile';
import { LoadingScreen } from '../components/LoadingScreen';
import { useNavigate } from 'react-router-dom';

export function TasksPage() {
  const navigate = useNavigate();
  const { profile } = useProfile(window.Telegram?.WebApp?.initDataUnsafe?.user || null);

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

  if (!profile) {
    return <LoadingScreen />;
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader title="Задания" icon={CheckSquare}>
        <p className="text-emerald-primary/80 text-sm mt-1">
          Выполняйте задания и зарабатывайте баллы
        </p>
      </PageHeader>

      <DailyTask user={profile} />
    </motion.div>
  );
}

export default TasksPage;