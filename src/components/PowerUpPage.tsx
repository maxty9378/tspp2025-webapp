import { supabase } from "../lib/supabase";
import { inter } from '@/app/ui/fonts';
import Image from 'next/image';

// Функция обработки конвертации монет в баллы
const handleConvert = async () => {
  if (!profile || powerUpData.coins < COIN_TO_POINTS_RATIO || isConverting || loading) return;

  try {
    setIsConverting(true);

    // Рассчитываем количество конверсий, баллы и оставшиеся монеты
    const conversions = Math.floor(powerUpData.coins / COIN_TO_POINTS_RATIO);
    const pointsToAdd = conversions * POINTS_PER_CONVERSION;
    const coinsToSpend = conversions * COIN_TO_POINTS_RATIO;
    const remainingCoins = powerUpData.coins - coinsToSpend;

    // Обновляем данные пользователя в базе
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        points: (profile.points || 0) + pointsToAdd,
        total_coins_earned: powerUpData.totalCoinsEarned,
        coins_task_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) throw error;

    // Обновляем локальное состояние
    setPowerUpData(prev => ({
      ...prev,
      coins: remainingCoins,
    }));

    // Отображаем уведомление об успешной конверсии
    showSuccessNotification(pointsToAdd);
  } catch (error) {
    console.error('Error converting coins:', error);
    showErrorNotification();
  } finally {
    setIsConverting(false);
  }
};

// Функция отображения уведомления об успешной конверсии
const showSuccessNotification = (pointsToAdd) => {
  const tg = window.Telegram?.WebApp;

  if (tg?.version && parseFloat(tg.version) >= 6.2) {
    tg.showPopup({
      title: 'Задание выполнено!',
      message: `Вы заработали ${pointsToAdd} баллов за конвертацию монет!\nЗадание "Заработайте DOIRP Coins" выполнено.`,
      buttons: [{ type: 'ok' }],
    });
  }

  if (tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  }
};

// Функция отображения уведомления об ошибке
const showErrorNotification = () => {
  showNotification({
    title: 'Ошибка',
    message: 'Не удалось конвертировать монеты. Попробуйте позже.',
    type: 'error',
  });
};

// Компонент для отображения изображения и баллов
const HeroSection = ({ points }) => (
  <div className="relative">
    <Image
      src="/hero-desktop.png"
      width={1000}
      height={760}
      className="hidden md:block"
      alt="Screenshots of the dashboard project showing desktop version"
    />
    <div
      className={`${inter.className} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-white`}
    >
      {points} pts
    </div>
  </div>
);

export default HeroSection;
