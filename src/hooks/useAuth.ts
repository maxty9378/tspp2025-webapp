import { useState, useEffect } from 'react';
import { TelegramUser } from '../types';
import { isDesktop } from '../utils/platform';
import { validateInitData, getInitData } from '../utils/initData';
import { initializeTelegramApp } from '../utils/telegram';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<TelegramUser | null>(null);
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleUnauthorizedAccess = () => {
    const tg = window.Telegram?.WebApp;
    if (tg?.showPopup) {
      tg.showPopup({
        title: 'Доступ запрещен',
        message: 'Это приложение доступно только для участников через Telegram',
        buttons: [{ type: 'close' }]
      });
    }
    if (tg?.close) {
      tg.close();
    }
  };

  useEffect(() => {
    try {
      // Check for admin auth first
      if (!isDesktop() && !validateInitData()) {
        setError('Недействительные данные инициализации');
        return;
      }

      const adminIds = ['5810535171', '283397879'];
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const isAdminUser = Boolean(tgUser && adminIds.includes(tgUser.id.toString()));
      
      if (isAdminUser || isDesktop()) {
        setIsAdmin(true);
        setIsWebAppReady(true);
        setCurrentUser({
          id: tgUser?.id.toString() || 'admin',
          first_name: tgUser?.first_name || 'Admin',
          username: tgUser?.username || '@kadochkindesign',
          is_admin: true
        });
        return;
      }

      // Handle Telegram WebApp
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        if (!isDesktop()) {
          handleUnauthorizedAccess();
        }
        return;
      }

      // Initialize Telegram features
      initializeTelegramApp();

      // Get validated init data
      const initData = getInitData();
      const user = initData?.user;

      if (!user) {
        if (!isDesktop()) {
          handleUnauthorizedAccess();
        }
        return;
      }

      user.is_admin = adminIds.includes(user.id.toString());
      if (user.is_admin) {
        setIsAdmin(true);
      }
      
      setCurrentUser(user);
      setIsWebAppReady(true);
    } catch (error) {
      console.error('Initialization error:', error);
      setError('Ошибка инициализации приложения');
    }
  }, []);

  return { currentUser, isWebAppReady, error, isAdmin };
}