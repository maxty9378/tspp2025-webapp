import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { fetchUsers } from '../lib/db';

const USERS_CACHE_KEY = 'users_cache';
const CACHE_DURATION = 60 * 1000; // 1 minute cache

function getCachedUsers(): { data: UserProfile[]; timestamp: number } | null {
  try {
    const cached = localStorage.getItem(USERS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Cache error:', error);
  }
  return null;
}

function setCachedUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(USERS_CACHE_KEY, JSON.stringify({
      data: users,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const cached = getCachedUsers();
    return cached?.data || [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const loadUsers = async (retryCount = 0) => {
      try {
        const fetchedUsers = await fetchUsers();
        
        if (!mounted) return;

        if (fetchedUsers.length === 0 && retryCount < 3) {
          // Retry if no users were fetched
          retryTimeout = setTimeout(() => {
            loadUsers(retryCount + 1);
          }, 2000);
          return;
        }

        setUsers(fetchedUsers);
        setCachedUsers(fetchedUsers);
        setError(null);
      } catch (error) {
        console.error('Error fetching users:', error);
        if (mounted) {
          setError('Ошибка загрузки пользователей');
          
          // Use cached data as fallback
          const cached = getCachedUsers();
          if (cached) {
            setUsers(cached.data);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    // Refresh data periodically
    const interval = setInterval(loadUsers, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(retryTimeout);
    };
  }, []);

  return { users, loading, error };
}