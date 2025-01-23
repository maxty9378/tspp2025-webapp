import React from 'react';
import { Trophy, Star } from 'lucide-react';
import { motion } from 'framer-motion';

import { POWERUP_CONFIG } from '../../config/powerUpConfig';

interface PowerUpStatsProps {
  coins: number;
  energy: number;
  level: number;
  experience: number;
}

export function PowerUpStats({ coins, energy, level, experience }: PowerUpStatsProps) {
  const experienceNeeded = level * 100;
  const experiencePercent = (experience / experienceNeeded) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Level and Experience */}
      <div className="card p-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-emerald-primary" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Уровень силы</div>
              <div className="text-xl font-bold text-emerald-light">{level}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Опыт</div>
            <div className="text-xl font-bold text-emerald-light">
              {experience}/{experienceNeeded}
            </div>
          </div>
        </div>
        {/* Experience Bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-primary"
            initial={{ width: 0 }}
            animate={{ width: `${experiencePercent}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
      </div>

      {/* Energy and Coins */}
      <div className="card p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-primary" />
              <span className="text-sm text-slate-400">Энергия</span>
            </div>
            <div className="text-xl font-bold text-emerald-light">
              {Math.floor(energy)}/{POWERUP_CONFIG.MAX_ENERGY}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Star className="w-4 h-4 text-amber-400" />
              </motion.div>
              <span className="text-sm text-slate-400">DOIRP Coin</span>
            </div>
            <div className="text-xl font-bold text-emerald-light">{coins}</div>
          </div>
        </div>
      </div>
    </div>
  );
}