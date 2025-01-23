import { showNotification } from './notifications';

interface WebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface WebAppChat {
  id: number;
  type: string;
  title: string;
  username?: string;
  photo_url?: string;
}

export interface WebAppInitData {
  query_id?: string;
  user?: WebAppUser;
  receiver?: WebAppUser;
  chat?: WebAppChat;
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  can_send_after?: number;
  auth_date: number;
  hash: string;
}

export function getInitData(): WebAppInitData | null {
  const tg = window.Telegram?.WebApp;
  
  if (!tg?.initData) {
    console.warn('No init data available');
    return null;
  }

  try {
    // Parse the raw init data
    const searchParams = new URLSearchParams(tg.initData);
    const initData: Partial<WebAppInitData> = {};
    
    // Extract all fields
    for (const [key, value] of searchParams.entries()) {
      if (key === 'user' || key === 'receiver' || key === 'chat') {
        initData[key] = JSON.parse(value);
      } else {
        initData[key] = value;
      }
    }

    // Validate required fields
    if (!initData.auth_date || !initData.hash) {
      console.error('Missing required init data fields');
      return null;
    }

    return initData as WebAppInitData;
  } catch (error) {
    console.error('Error parsing init data:', error);
    return null;
  }
}

export function validateInitData(): boolean {
  const tg = window.Telegram?.WebApp;
  
  if (!tg?.initData) {
    showNotification({
      title: 'Ошибка',
      message: 'Приложение должно быть открыто через Telegram',
      type: 'error'
    });
    return false;
  }

  const initData = getInitData();
  if (!initData) {
    showNotification({
      title: 'Ошибка',
      message: 'Недействительные данные инициализации',
      type: 'error'
    });
    return false;
  }

  // Check auth date (within last 24 hours)
  const authDate = initData.auth_date * 1000; // Convert to milliseconds
  const now = Date.now();
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  if (now - authDate > MAX_AGE) {
    showNotification({
      title: 'Ошибка',
      message: 'Срок действия данных истек',
      type: 'error'
    });
    return false;
  }

  return true;
}