import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { showNotification } from '../utils/notifications';
import { sleep } from '../utils/helpers';

// Configuration constants
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  HEADERS: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
} as const;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: undefined
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 
      'x-client-info': 'telegram-mini-app',
    },
  },
  fetch: (url, options = {}) => {
    return fetch(url, {
      ...options,
      signal: options.signal,
      headers: {
        ...options.headers,
        ...CONFIG.HEADERS
      }
    }).catch(async error => {
      for (let i = 0; i < 3; i++) {
        try {
          await sleep(1000 * Math.pow(2, i)); // Exponential backoff
          const response = await fetch(url, options);
          return response;
        } catch (retryError) {
          if (i === 2) throw retryError; // Throw on final retry
        }
      }
      throw error;
    });
  }
});

// Add connection check with retry
export async function checkConnection(retries = CONFIG.MAX_RETRIES): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (!error) return true;
      await sleep(CONFIG.RETRY_DELAY * Math.pow(2, i));
    } catch (error) {
      if (i === retries - 1) return false;
      await sleep(CONFIG.RETRY_DELAY * Math.pow(2, i));
    }
  }
  return false;
}

export async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < CONFIG.MAX_RETRIES; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Operation failed (attempt ${i + 1}/${CONFIG.MAX_RETRIES}):`, error);
      
      if (i < CONFIG.MAX_RETRIES - 1) {
        await sleep(CONFIG.RETRY_DELAY * Math.pow(2, i));
      }
    }
  }

  throw lastError;
}

export async function withConnection<T>(operation: () => Promise<T>): Promise<T> {
  try {
    const isConnected = await checkConnection();
    if (!isConnected) {
      throw new Error('No database connection');
    }
    return await withRetry(operation);
  } catch (error) {
    console.error('Connection error:', error);
    throw error;
  }
}