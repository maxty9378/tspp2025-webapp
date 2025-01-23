import React from 'react';
import { useLocation, Link } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export function NavLink({ to, icon, label }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  const handleClick = () => {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback && !isActive) {
      tg.HapticFeedback.impactOccurred('light');
      tg.HapticFeedback.selectionChanged();
      
      // Add subtle pop animation
      const element = document.activeElement as HTMLElement;
      if (element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
          element.style.transform = '';
        }, 100);
      }
    }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`flex flex-col items-center py-1.5 px-4 transition-all duration-300 rounded-lg ${
        isActive
          ? 'text-emerald-primary bg-emerald-primary/10'
          : 'text-gray-400 hover:text-emerald-primary hover:bg-emerald-primary/5'
      }`}
      style={{ minWidth: '64px' }}
    >
      <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
        {icon}
      </div>
      <span className={`text-xs mt-1 transition-all duration-200 whitespace-nowrap ${
        isActive ? 'font-medium' : ''
      }`}>
        {label}
      </span>
    </Link>
  );
}