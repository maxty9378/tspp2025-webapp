import { isTelegramWebApp, isCloudStorageAvailable } from './platform';
import { showNotification } from './notifications';

interface StorageOptions {
  prefix?: string;
  ttl?: number; // Time to live in milliseconds
}

const DEFAULT_OPTIONS: StorageOptions = {
  prefix: 'twa_',
  ttl: 24 * 60 * 60 * 1000 // 24 hours
};

export async function setCloudItem(key: string, value: any, options: StorageOptions = {}) {
  const { prefix } = { ...DEFAULT_OPTIONS, ...options };
  const tg = window.Telegram?.WebApp;
  
  try {
    // Only use cloud storage in Telegram WebApp
    if (!isTelegramWebApp() || !isCloudStorageAvailable()) {
      // Fallback to localStorage if CloudStorage is not available
      localStorage.setItem(`${prefix}${key}`, JSON.stringify({
        value,
        timestamp: Date.now()
      }));
      return true;
    }

    await tg.CloudStorage.setItem(`${prefix}${key}`, JSON.stringify({
      value,
      timestamp: Date.now()
    }));
    return true;
  } catch (error) {
    console.error('Error setting cloud item:', error);
    return false;
  }
}

export async function getCloudItem<T>(key: string, options: StorageOptions = {}): Promise<T | null> {
  const { prefix, ttl } = { ...DEFAULT_OPTIONS, ...options };
  const tg = window.Telegram?.WebApp;
  
  try {
    let storedData;

    // Only use cloud storage in Telegram WebApp
    if (!isTelegramWebApp() || !isCloudStorageAvailable()) {
      // Fallback to localStorage
      storedData = localStorage.getItem(`${prefix}${key}`);
    } else {
      storedData = await tg.CloudStorage.getItem(`${prefix}${key}`);
    }

    if (!storedData) return null;

    const { value, timestamp } = JSON.parse(storedData);
    
    // Check if data is expired
    if (ttl && Date.now() - timestamp > ttl) {
      await removeCloudItem(key, options);
      return null;
    }

    return value as T;
  } catch (error) {
    console.error('Error getting cloud item:', error);
    return null;
  }
}

export async function removeCloudItem(key: string, options: StorageOptions = {}) {
  const { prefix } = { ...DEFAULT_OPTIONS, ...options };
  const tg = window.Telegram?.WebApp;
  
  try {
    // Only use cloud storage in Telegram WebApp
    if (!isTelegramWebApp() || !isCloudStorageAvailable()) {
      localStorage.removeItem(`${prefix}${key}`);
      return true;
    }

    await tg.CloudStorage.removeItem(`${prefix}${key}`);
    return true;
  } catch (error) {
    console.error('Error removing cloud item:', error);
    return false;
  }
}

export async function getCloudKeys(options: StorageOptions = {}): Promise<string[]> {
  const { prefix } = { ...DEFAULT_OPTIONS, ...options };
  const tg = window.Telegram?.WebApp;
  
  try {
    // Only use cloud storage in Telegram WebApp
    if (!isTelegramWebApp() || !isCloudStorageAvailable()) {
      // Fallback to localStorage
      return Object.keys(localStorage)
        .filter(key => key.startsWith(prefix))
        .map(key => key.slice(prefix.length));
    }

    const keys = await tg.CloudStorage.getKeys();
    return keys
      .filter(key => key.startsWith(prefix))
      .map(key => key.slice(prefix.length));
  } catch (error) {
    console.error('Error getting cloud keys:', error);
    return [];
  }
}

export async function clearExpiredItems(options: StorageOptions = {}) {
  const { prefix, ttl } = { ...DEFAULT_OPTIONS, ...options };
  const tg = window.Telegram?.WebApp;
  
  try {
    const keys = await getCloudKeys({ prefix });
    const now = Date.now();

    for (const key of keys) {
      const item = await getCloudItem(key, { prefix });
      if (item && ttl && now - item.timestamp > ttl) {
        await removeCloudItem(key, { prefix });
      }
    }
  } catch (error) {
    console.error('Error clearing expired items:', error);
  }
}