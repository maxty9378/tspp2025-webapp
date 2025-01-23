import { z } from 'zod';

const getEnvVar = (key: string, required = true): string => {
  const value = import.meta.env[key];
  if (!value && required) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value || '';
};

export const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_TELEGRAM_BOT_TOKEN: z.string().optional(),
  VITE_TELEGRAM_GROUP_CHAT_ID: z.string().optional(),
  MODE: z.enum(['development', 'production']).default('development'),
  VITE_APP_VERSION: z.string().default('1.0.0')
});

const rawConfig = {
  VITE_SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
  VITE_SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  VITE_TELEGRAM_BOT_TOKEN: getEnvVar('VITE_TELEGRAM_BOT_TOKEN', false),
  VITE_TELEGRAM_GROUP_CHAT_ID: getEnvVar('VITE_TELEGRAM_GROUP_CHAT_ID', false),
  MODE: import.meta.env.MODE || 'development',
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0'
};

export const config = envSchema.parse(rawConfig);