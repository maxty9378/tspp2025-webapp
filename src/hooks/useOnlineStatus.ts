import { useEffect } from 'react';
import { updateUser } from '../lib/db';

export function useOnlineStatus(userId: string | null) {
  useEffect(() => {
    if (!userId || userId === 'admin') return;

    const updateOnlineStatus = async () => {
      try {
        await updateUser(userId, { lastActive: new Date() });
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    updateOnlineStatus();

    return () => {
      if (userId) {
        updateUser(userId, { lastActive: new Date() }).catch(console.error);
      }
    };
  }, [userId]);
}