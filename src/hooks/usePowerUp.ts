import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';
import { useProfile } from './useProfile';
import { getLevelTitle } from '../utils/levelTitles';
import { POWERUP_CONFIG } from '../config/powerUpConfig';

const {
  MAX_ENERGY,
  ENERGY_REGEN_RATE,
  ENERGY_COST,
  COIN_TO_POINTS_RATIO,
  POINTS_PER_CONVERSION,
  STORAGE_KEYS
} = POWERUP_CONFIG;

export function usePowerUp() {
  const { profile } = useProfile(window.Telegram?.WebApp?.initDataUnsafe?.user || null);
  const [powerUpData, setPowerUpData] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.STATE);
    return stored ? JSON.parse(stored) : { 
      coins: profile?.total_coins_earned || 0,
      totalCoinsEarned: profile?.total_coins_earned || 0,
      level: Math.floor((profile?.total_coins_earned || 0) / 1000) + 1,
      experience: 0
    };
  });
  const [energy, setEnergy] = useState(() => {
    const savedEnergy = localStorage.getItem(STORAGE_KEYS.ENERGY);
    const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
    
    if (savedEnergy && lastUpdate) {
      const timeDiff = Math.min(
        (Date.now() - parseInt(lastUpdate)) / 1000,
        MAX_ENERGY / ENERGY_REGEN_RATE
      );
      const regeneratedEnergy = timeDiff * ENERGY_REGEN_RATE;
      return Math.min(parseFloat(savedEnergy) + regeneratedEnergy, MAX_ENERGY);
    }
    
    return MAX_ENERGY;
  });

  // Persist energy state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENERGY, energy.toString());
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
  }, [energy]);

  const [isConverting, setIsConverting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved state and sync with profile
  useEffect(() => {
    if (profile) {
      const savedState = localStorage.getItem(STORAGE_KEYS.STATE);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setPowerUpData(prev => ({
          ...parsed,
          totalCoinsEarned: profile.total_coins_earned || 0
        }));
      } else {
        setPowerUpData(prev => ({
          ...prev,
          totalCoinsEarned: profile.total_coins_earned || 0,
          coins: profile.total_coins_earned || 0
        }));
      }
      setLoading(false);
    }
  }, [profile]);

  // Save state changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(powerUpData));
    }
  }, [powerUpData, loading]);

  // Energy regeneration
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => {
        const newEnergy = Math.min(prev + ENERGY_REGEN_RATE, MAX_ENERGY);
        localStorage.setItem(STORAGE_KEYS.ENERGY, newEnergy.toString());
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
        return newEnergy;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = async (x: number, y: number) => {
    if (energy <= 0) {
      showNotification({
        title: 'Недостаточно энергии',
        message: 'Подождите пока энергия восстановится',
        type: 'warning'
      });
      return;
    }

    // Reduce energy
    setEnergy(prev => { 
      const newEnergy = Math.max(0, prev - POWERUP_CONFIG.ENERGY_COST);
      localStorage.setItem(POWERUP_CONFIG.STORAGE_KEYS.ENERGY, newEnergy.toString());
      localStorage.setItem(POWERUP_CONFIG.STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
      return newEnergy;
    });

    // Calculate coins earned based on level and random factor
    const baseCoins = Math.floor(Math.random() * 3) + 1;
    const levelMultiplier = 1 + (powerUpData.level - 1) * 0.1;
    const coinsEarned = Math.round(baseCoins * levelMultiplier);
    const newCoins = powerUpData.coins + coinsEarned;
    const newTotalEarned = powerUpData.totalCoinsEarned + coinsEarned;

    // Update experience and level
    const newExperience = powerUpData.experience + coinsEarned;
    const experienceNeeded = powerUpData.level * 100;
    let newLevel = powerUpData.level;
    let remainingExperience = newExperience;
    let isLevelUp = false;

    if (newExperience >= experienceNeeded) {
      newLevel++;
      remainingExperience = newExperience - experienceNeeded;
      isLevelUp = true;
      
      showNotification({
        title: 'Уровень повышен!',
        message: `Достигнут ${newLevel} уровень • ${getLevelTitle(newLevel)}`,
        type: 'success'
      });

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
        tg.HapticFeedback.impactOccurred('heavy');
      }
    }

    setPowerUpData(prev => ({
      ...prev,
      coins: newCoins,
      totalCoinsEarned: newTotalEarned,
      level: newLevel,
      experience: remainingExperience
    }));

    // Update user's total coins in database
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          total_coins_earned: newTotalEarned,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating total coins:', error);
    }

    // Add haptic feedback
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      if (isLevelUp) {
        tg.HapticFeedback.notificationOccurred('success');
        tg.HapticFeedback.impactOccurred('heavy');
      } else {
        tg.HapticFeedback.impactOccurred('light');
      }
    }
  };

  const handleConvert = async () => {
    if (!profile || powerUpData.coins < COIN_TO_POINTS_RATIO || isConverting || loading) return;

    try {
      setIsConverting(true);

      const conversions = Math.floor(powerUpData.coins / COIN_TO_POINTS_RATIO);
      const pointsToAdd = conversions * POINTS_PER_CONVERSION;
      const coinsToSpend = conversions * COIN_TO_POINTS_RATIO;
      const remainingCoins = powerUpData.coins - coinsToSpend;

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          points: (profile.points || 0) + pointsToAdd
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update coins task completion status
      await supabase
        .from('users')
        .update({
          total_coins_earned: powerUpData.totalCoinsEarned,
          coins_task_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      setPowerUpData(prev => ({
        ...prev,
        coins: remainingCoins
      }));

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }

      showNotification({
        title: 'Конвертация успешна!',
        message: `+${pointsToAdd} баллов\nПотрачено: ${coinsToSpend} монет\nОсталось: ${remainingCoins} монет`,
        type: 'success'
      });

    } catch (error) {
      console.error('Error converting coins:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось конвертировать монеты',
        type: 'error'
      });
    } finally {
      setIsConverting(false);
    }
  };

  return {
    profile,
    powerUpData,
    energy,
    handleClick,
    handleConvert,
    isConverting,
    loading
  };
}