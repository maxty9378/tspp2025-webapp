import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { checkSupabaseConnection } from '../lib/supabase';

interface ConnectionStatusProps {
  showInAdminOnly?: boolean;
}

export function ConnectionStatus({ showInAdminOnly = true }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const status = await checkSupabaseConnection();
      setIsConnected(status);
    } catch (error) {
      console.error('Connection check error:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null || (showInAdminOnly && !localStorage.getItem('isAdmin'))) {
    return null;
  }

  return null;
}