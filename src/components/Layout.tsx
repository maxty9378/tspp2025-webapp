import React, { useState, useEffect } from 'react';
import { Home, Users, Calendar, CheckSquare, MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { NavLink } from './NavLink';
import { PullToDismiss } from './PullToDismiss';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [bottomInset, setBottomInset] = useState(0);
  const isChat = location.pathname === '/chat';
  const [systemPadding, setSystemPadding] = useState(0);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const updateLayout = () => {
      // Add extra padding on Android to prevent system button touches
      const safeAreaBottom = tg.platform === 'android' ? 16 : 0; 
      const systemPadding = tg.platform === 'android' ? 48 : 0;
      setBottomInset(safeAreaBottom);
      setSystemPadding(systemPadding);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  if (isChat) {
    return children;
  }

  return (
    <PullToDismiss>
      <div 
        className="min-h-screen flex flex-col bg-[#0f172a] relative"
        style={{
          paddingBottom: `${systemPadding}px`,
          paddingTop: 'var(--content-safe-area-top)',
          paddingRight: 'var(--content-safe-area-right)',
          paddingLeft: 'var(--content-safe-area-left)'
        }}
      >
        <main className="flex-1 w-full pt-4 pb-24 overflow-y-auto overscroll-none -mb-[72px]">
          <div className="max-w-2xl mx-auto px-4">
            {children}
          </div>
        </main>
        
        <nav 
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-lg border-t border-slate-800/50 will-change-transform"
          style={{ 
            paddingBottom: `max(${bottomInset + systemPadding}px, env(safe-area-inset-bottom))`,
            transform: 'translate3d(0,0,0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <div className="max-w-2xl mx-auto flex justify-between items-center gap-2 px-4 py-3">
            <NavLink to="/" icon={<Home className="w-5 h-5" />} label="Главная" />
            <NavLink to="/program" icon={<Calendar className="w-5 h-5" />} label="Программа" />
            <NavLink to="/tasks" icon={<CheckSquare className="w-5 h-5" />} label="Задания" />
            <NavLink to="/chat" icon={<MessageSquare className="w-5 h-5" />} label="Чат" />
            <NavLink to="/users" icon={<Users className="w-5 h-5" />} label="Участники" />
          </div>
        </nav>
      </div>
    </PullToDismiss>
  );
}