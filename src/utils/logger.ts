import { supabase } from '../lib/supabase';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  userId: string;
  details: Record<string, any>;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private readonly TABLE_NAME = 'system_logs';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async saveLog(entry: LogEntry): Promise<void> {
    try {
      // Handle unknown user ID
      const userId = entry.userId === 'unknown' ? null : entry.userId;

      const { error } = await supabase
        .rpc('log_system_event', {
          p_level: entry.level,
          p_event: entry.event,
          p_user_id: userId,
          p_details: entry.details,
          p_error_message: entry.error?.message,
          p_error_stack: entry.error?.stack
        });

      if (error) {
        // Only log to console if saving to DB fails
        console.error('[Logger] Failed to save log:', {
          level: entry.level,
          event: entry.event,
          userId,
          error
        });
      }

      // Also log to console in development
      if (import.meta.env.DEV) {
        const logFn = entry.level === 'error' ? console.error : 
                     entry.level === 'warn' ? console.warn : 
                     console.log;
        logFn(
          `[${entry.timestamp}] ${entry.level.toUpperCase()} - ${entry.event}`,
          {
            userId: entry.userId,
            ...entry.details,
            ...(entry.error && { error: entry.error })
          }
        );
      }
    } catch (error) {
      console.error('Logging error:', error);
    }
  }

  public async info(event: string, userId?: string, details: Record<string, any> = {}): Promise<void> {
    await this.saveLog({
      timestamp: new Date().toISOString(),
      level: 'info',
      event,
      userId: userId || 'system',
      details
    });
  }

  public async warn(event: string, userId?: string, details: Record<string, any> = {}): Promise<void> {
    await this.saveLog({
      timestamp: new Date().toISOString(),
      level: 'warn',
      event,
      userId: userId || 'system',
      details
    });
  }

  public async error(event: string, userId: string | undefined, error: Error, details: Record<string, any> = {}): Promise<void> {
    await this.saveLog({
      timestamp: new Date().toISOString(),
      level: 'error',
      event,
      userId: userId || 'system',
      details,
      error
    });
  }
}

export const logger = Logger.getInstance();