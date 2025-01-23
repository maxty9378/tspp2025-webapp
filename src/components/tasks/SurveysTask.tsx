import React from 'react';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SurveysTaskProps {
  completedSurveys: number;
  hasCompletedSurveys: boolean;
}

export function SurveysTask({ completedSurveys, hasCompletedSurveys }: SurveysTaskProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/tests');
  };

  return (
    <motion.button 
      onClick={handleClick}
      className={`card p-4 ${
        hasCompletedSurveys 
          ? 'bg-emerald-500/10 border border-emerald-500/20' 
          : 'bg-slate-800/50 border border-slate-700/30 cursor-pointer hover:bg-slate-800/70'
      } transition-colors`}
      whileHover={!hasCompletedSurveys ? { scale: 1.02 } : undefined}
      whileTap={!hasCompletedSurveys ? { scale: 0.98 } : undefined}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          hasCompletedSurveys ? 'bg-emerald-500/20' : 'bg-slate-700/50'
        }`}>
          <BookOpen className={`w-4 h-4 ${
            hasCompletedSurveys ? 'text-emerald-400' : 'text-slate-400'
          }`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${
              hasCompletedSurveys ? 'text-emerald-300' : 'text-slate-300'
            }`}>
              Пройдите тесты
            </h4>
            <div className="flex items-center gap-1 text-blue-400">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">
                {completedSurveys}/3
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            {hasCompletedSurveys 
              ? 'Вы прошли все тесты' 
              : 'Пройдите 3 теста (+40 баллов каждый)'}
          </p>
        </div>
      </div>
    </motion.button>
  );
}