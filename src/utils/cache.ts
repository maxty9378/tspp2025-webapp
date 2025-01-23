export interface CacheItem<T> {
  data: T;
  timestamp: number;
}
import { isTelegramWebApp } from './platform';

export interface CacheOptions {
  duration?: number;
  prefix?: string;
  useCloud?: boolean;
}

const DEFAULT_OPTIONS: CacheOptions = {
  duration: 5 * 60 * 1000, // 5 minutes
  prefix: 'app_cache_',
  useCloud: true
};

export async function getFromCache<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
  const { duration, prefix, useCloud } = { ...DEFAULT_OPTIONS, ...options };
  
  // Only use cloud storage in Telegram WebApp
  const shouldUseCloud = useCloud && isTelegramWebApp();
  
  try {
    if (shouldUseCloud) {
      const cloudItem = await getCloudItem<CacheItem<T>>(key, { prefix, ttl: duration });
      if (cloudItem) {
        return cloudItem.data;
      }
    }

    const cached = localStorage.getItem(`${prefix}${key}`);
    if (cached) {
      const item: CacheItem<T> = JSON.parse(cached);
      if (Date.now() - item.timestamp < duration) {
        return item.data;
      }
      // Remove expired cache
      localStorage.removeItem(`${prefix}${key}`);
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
}

export async function setInCache<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
  const { prefix, useCloud } = { ...DEFAULT_OPTIONS, ...options };
  
  // Only use cloud storage in Telegram WebApp
  const shouldUseCloud = useCloud && isTelegramWebApp();
  
  try {
    if (shouldUseCloud) {
      await setCloudItem(key, { data, timestamp: Date.now() }, { prefix });
    }

    localStorage.setItem(`${prefix}${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      // Clear old cache items if storage is full
      clearOldCache(options);
      try {
        // Try setting again after clearing
        localStorage.setItem(`${prefix}${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
        return;
      } catch (retryError) {
        console.error('Cache retry error:', retryError);
      }
    }
    console.error('Cache write error:', error);
  }
}

export async function removeFromCache(key: string, options: CacheOptions = {}): Promise<void> {
  const { prefix, useCloud } = { ...DEFAULT_OPTIONS, ...options };
  
  // Only use cloud storage in Telegram WebApp
  const shouldUseCloud = useCloud && isTelegramWebApp();
  
  try {
    if (shouldUseCloud) {
      await removeCloudItem(key, { prefix });
    }
    localStorage.removeItem(`${prefix}${key}`);
  } catch (error) {
    console.error('Cache remove error:', error);
  }
}

function clearOldCache(options: CacheOptions = {}): void {
  const { prefix, duration } = { ...DEFAULT_OPTIONS, ...options };
  const now = Date.now();
  
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        try {
          const item: CacheItem<unknown> = JSON.parse(localStorage.getItem(key) || '');
          if (now - item.timestamp > duration) {
            localStorage.removeItem(key);
          }
        } catch {
          // Remove invalid cache items
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}