import React from 'react';
import { Zap } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PowerUpGame } from '../components/power-up/PowerUpGame';
import { PowerUpStats } from '../components/power-up/PowerUpStats';
import { PowerUpConverter } from '../components/power-up/PowerUpConverter';
import { usePowerUp } from '../hooks/usePowerUp';
import { getLevelTitle } from '../utils/levelTitles';

export function PowerUpPage() {
  const { 
    profile,
    powerUpData,
    energy,
    handleClick,
    handleConvert,
    isConverting,
    loading
  } = usePowerUp();

  if (!profile) {
    return (
      <div className="card p-6">
        <p className="text-slate-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Прокачка" icon={Zap}>
        <div className="flex items-center justify-between">
          <p className="text-emerald-primary/80 text-sm mt-1">
            Сражайтесь и зарабатывайте DOIRP Coin
          </p>
          <div className="text-sm text-amber-300">
            {getLevelTitle(powerUpData.level)}
          </div>
        </div>
      </PageHeader>

      <PowerUpStats 
        coins={powerUpData.coins}
        energy={energy}
        level={powerUpData.level}
        experience={powerUpData.experience}
      />

      <PowerUpGame
        onPowerUp={handleClick}
        energy={energy}
        coins={powerUpData.coins}
        level={powerUpData.level}
      />

      <PowerUpConverter
        coins={powerUpData.coins}
        onConvert={handleConvert}
        isConverting={isConverting}
        loading={loading}
      />
    </div>
  );
}