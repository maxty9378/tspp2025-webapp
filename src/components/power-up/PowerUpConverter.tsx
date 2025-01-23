import React from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface PowerUpConverterProps {
  coins: number;
  onConvert: () => void;
  isConverting: boolean;
  loading: boolean;
}

const COIN_TO_POINTS_RATIO = 1000;
const POINTS_PER_CONVERSION = 10;

export function PowerUpConverter({ coins, onConvert, isConverting, loading }: PowerUpConverterProps) {
  const canConvert = coins >= COIN_TO_POINTS_RATIO;
  const conversions = Math.floor(coins / COIN_TO_POINTS_RATIO);
  const pointsToGet = conversions * POINTS_PER_CONVERSION;
  const multiplier = Math.floor(coins / COIN_TO_POINTS_RATIO);

  return (
    <motion.button
      onClick={onConvert}
      disabled={!canConvert || isConverting || loading}
      className={`card w-full p-4 text-left transition-all duration-300 ${
        canConvert && !isConverting && !loading
          ? 'bg-emerald-primary/20 hover:bg-emerald-primary/30 hover:scale-[1.02]' 
          : 'opacity-50'
      }`}
      whileHover={canConvert ? { scale: 1.02 } : undefined}
      whileTap={canConvert ? { scale: 0.98 } : undefined}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-400">
            {isConverting ? 'Конвертация...' : 'Конвертировать'}
          </div>
          <div className="text-lg font-medium text-emerald-light flex items-center gap-2">
            <span>{COIN_TO_POINTS_RATIO}</span>
            <Coins className="w-4 h-4" />
            <span>→</span>
            <span>{POINTS_PER_CONVERSION} баллов</span>
            {multiplier > 1 && (
              <span className="text-amber-300">x{multiplier}</span>
            )}
          </div>
        </div>
        {canConvert && (
          <div className="text-sm text-emerald-light">
            Доступно: {pointsToGet} баллов
          </div>
        )}
      </div>
    </motion.button>
  );
}