import React from 'react';
import { UserProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

interface GreetingDisplayProps {
  user: UserProfile;
  messageType: string;
  canPost: boolean;
  timeLeft: number;
  formatTimeLeft: (ms: number) => string | null;
  onEdit: () => void;
  message: string | null;
  isLoading: boolean;
}

export function GreetingDisplay({ 
  user, 
  messageType, 
  canPost, 
  timeLeft, 
  formatTimeLeft,
  onEdit,
  message,
  isLoading
}: GreetingDisplayProps) {
  return (
    <div 
      onClick={() => canPost && onEdit()}
      className={`p-3 bg-slate-800/50 rounded-lg transition-colors ${
        !canPost ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-800'
      }`}
    >
      <div className="space-y-2">
        <p className="text-sm text-slate-300">
          {isLoading ? 'Загрузка...' : message || `Нажмите, чтобы добавить ${messageType.toLowerCase()}`}
        </p>
        {timeLeft > 0 && (
          <p className="text-xs text-slate-400">
            Следующее сообщение через: {formatTimeLeft(timeLeft)}
          </p>
        )}
      </div>
    </div>
  );
}