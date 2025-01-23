import { useState, useEffect, useCallback, useRef } from 'react';
import { TelegramUser, UserProfile } from '../types';
import { supabase, withConnection } from '../lib/supabase';
import { isDesktop } from '../utils/platform';
import { showNotification } from '../utils/notifications';

const SYNC_INTERVAL = 30000; // 30 seconds
const PROFILE_CACHE_KEY = 'profile_cache';
const LAST_VISIT_KEY = 'last_visit_timestamp';
const VISIT_THRESHOLD = 30 * 60 * 1000; // 30 minutes

function getCachedProfile(): { data: UserProfile; timestamp: number } | null {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < SYNC_INTERVAL) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Cache error:', error);
  }
  return null;
}

function setCachedProfile(profile: UserProfile) {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
      data: profile,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export function useProfile(currentUser: TelegramUser | null) {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const cached = getCachedProfile();
    return cached?.data || null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeConfetti, setShowWelcomeConfetti] = useState(false);
  const mountedRef = useRef(true);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      retryCount.current = 0;
    };
  }, []);

  const fetchProfile = async (userId: string, currentUser: TelegramUser) => {
    const now = new Date().toISOString();
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const isNewVisit = !lastVisit || (Date.now() - parseInt(lastVisit)) > VISIT_THRESHOLD;
    const tg = window.Telegram?.WebApp;

    try {
      const { data: existingUser, error: fetchError } = await withConnection(() => 
        supabase
        .from('users')
        .select('id, username, first_name, last_name, photo_url, points, visit_count, last_visit, last_active, is_admin, role, streak, created_at, updated_at, liked_by, likes, total_coins_earned')
        .eq('id', userId)
        .maybeSingle()
      );

      if (fetchError) {
        if (tg?.showPopup) {
          tg.showPopup({
            title: 'Ошибка загрузки',
            message: 'Не удалось загрузить профиль. Повторная попытка...',
            buttons: [{ type: 'ok' }]
          });
        }
        throw fetchError;
      }

      if (!existingUser) {
        // Create new user
        const newUser = {
          id: userId,
          username: currentUser.username || '',
          first_name: currentUser.first_name,
          last_name: currentUser.last_name || '',
          photo_url: currentUser.photo_url || '',
          points: 10,
          visit_count: 1,
          last_visit: now,
          last_active: now,
          is_admin: Boolean(currentUser.is_admin),
          role: 'participant',
          streak: 1,
          created_at: now,
          updated_at: now,
          liked_by: [],
          likes: [],
          total_coins_earned: 0
        };

        const { data: createdUser, error: createError } = await withConnection(() => supabase
          .from('users')
          .insert([newUser])
          .select()
          .single());

        if (createError) throw createError;

        if (mountedRef.current) {
          setProfile(createdUser);
          setCachedProfile(createdUser);
          setShowWelcomeConfetti(true);
          setTimeout(() => setShowWelcomeConfetti(false), 5000);
        }

      } else {
        // Update existing user
        const updates = {
          last_active: now,
          updated_at: now
        };

        if (isNewVisit) {
          updates.visit_count = (existingUser.visit_count || 0) + 1;
          updates.last_visit = now;
        }

        const { data: updatedUser, error: updateError } = await withConnection(() => supabase
          .from('users')
          .update(updates)
          .eq('id', userId)
          .select()
          .single());

        if (updateError) throw updateError;

        if (mountedRef.current) {
          setProfile(updatedUser);
          setCachedProfile(updatedUser);
          if (isNewVisit) {
            localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
          }
        }
      }

      setError(null);
      retryCount.current = 0;

    } catch (error) {
      console.error('Profile sync error:', error);
      
      if (mountedRef.current) {
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current++;
          setTimeout(() => {
            fetchProfile(userId, currentUser);
          }, 1000 * Math.pow(2, retryCount.current));
        } else {
          setError('Ошибка синхронизации профиля');
          showNotification({
            title: 'Ошибка синхронизации',
            message: error instanceof Error ? error.message : 'Не удалось синхронизировать профиль',
            type: 'error'
          });
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Create mock admin profile for browser
  const createMockAdminProfile = (): UserProfile => ({
    id: 'admin',
    username: '@SNS',
    first_name: 'Admin',
    last_name: 'DOiRP',
    photo_url: 'https://static.tildacdn.com/tild3834-6331-4830-b162-626630356164/-2.jpg',
    points: 100,
    visit_count: 1,
    last_visit: new Date().toISOString(),
    last_active: new Date().toISOString(),
    is_admin: true,
    role: 'organizer',
    streak: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    liked_by: [],
    likes: [],
    total_coins_earned: 0,
    daily_likes_given: 0
  });

  useEffect(() => {
    // If running in browser as admin, create mock profile
    if (isDesktop()) {
      const createAdminProfile = async () => {
        try {
          const mockProfile = createMockAdminProfile();
          setProfile(mockProfile);
        } catch (error) {
          console.error('Error setting up admin profile:', error);
        }
        setLoading(false);
      };

      createAdminProfile();
      return;
    }

    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const userId = currentUser.id.toString();
    let syncInterval: NodeJS.Timeout;

    const syncProfile = async () => {
      try {
        // First try to get from cache
        const cached = getCachedProfile();
        if (cached?.data && retryCount.current === 0) {
          setProfile(cached.data);
          setLoading(false);
        }

        const { data: existingUser, error: fetchError } = await withConnection(() => 
          supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle()
        );

        if (fetchError) throw fetchError;

        const now = new Date().toISOString();
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        const isNewVisit = !lastVisit || (Date.now() - parseInt(lastVisit)) > VISIT_THRESHOLD;

        if (!existingUser) {
          // Create new user
          const newUser: Partial<UserProfile> = {
            id: userId,
            username: currentUser.username || '',
            first_name: currentUser.first_name,
            last_name: currentUser.last_name || '',
            photo_url: currentUser.photo_url || '',
            points: 10,
            visit_count: 1,
            last_visit: now,
            last_active: now,
            is_admin: Boolean(currentUser.is_admin),
            role: 'participant',
            streak: 1,
            created_at: now,
            updated_at: now
          };

          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single();

          if (createError) throw createError;

          if (mountedRef.current) {
            setProfile(createdUser);
            setCachedProfile(createdUser);
            setShowWelcomeConfetti(true);
            setTimeout(() => setShowWelcomeConfetti(false), 5000);
          }

        } else {
          // Update existing user
          const updates: Partial<UserProfile> = {
            last_active: now,
            updated_at: now
          };

          if (isNewVisit) {
            updates.visit_count = (existingUser.visit_count || 0) + 1;
            updates.last_visit = now;
          }

          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

          if (updateError) throw updateError;

          if (mountedRef.current) {
            setProfile(updatedUser);
            setCachedProfile(updatedUser);
            if (isNewVisit) {
              localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
            }
          }
        }

        setError(null);
        retryCount.current = 0;

      } catch (error) {
        console.error('Profile sync error:', error);
        
        if (mountedRef.current) {
          if (retryCount.current < MAX_RETRIES) {
            retryCount.current++;
            setTimeout(() => {
              if (mountedRef.current) {
                syncProfile();
              }
            }, 2000 * Math.pow(2, retryCount.current));
          } else {
            setError('Ошибка синхронизации профиля');
            showNotification({
              title: 'Ошибка синхронизации',
              message: 'Не удалось синхронизировать профиль',
              type: 'error'
            });
          }
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Initial sync
    syncProfile();

    // Set up periodic sync
    syncInterval = setInterval(() => {
      if (mountedRef.current) {
        retryCount.current = 0; // Reset retry count for periodic syncs
        syncProfile();
      }
    }, SYNC_INTERVAL);

    return () => {
      mountedRef.current = false;
      retryCount.current = 0;
      clearInterval(syncInterval);
    };
  }, [currentUser]);

  return { profile, loading, error, showWelcomeConfetti };
}