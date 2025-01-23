import React from 'react';
import { TelegramUser } from '../types';
import { isDesktop } from '../utils/platform';
import { UserHomePage } from './UserHomePage';
import { AdminHomePage } from './AdminHomePage';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  currentUser: TelegramUser | null;
}

export function HomePage({ currentUser }: HomePageProps) {
  const navigate = useNavigate();
  const isAdmin = isDesktop() || Boolean(
    currentUser?.username === '@kadochkindesign' && currentUser?.is_admin
  );

  if (!currentUser && !isAdmin) {
    return (
      <div className="card p-6">
        <p className="text-slate-400">Пожалуйста, откройте приложение через Telegram.</p>
      </div>
    );
  }

  return isAdmin ? (
    <AdminHomePage currentUser={currentUser} />
  ) : (
    <UserHomePage currentUser={currentUser} />
  );
}