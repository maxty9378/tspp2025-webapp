import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (success: boolean) => void;
}

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin'
};

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.username === ADMIN_CREDENTIALS.username && 
        credentials.password === ADMIN_CREDENTIALS.password) {
      localStorage.setItem('admin_auth', 'true');
      localStorage.setItem('adminUsername', '@kadochkindesign');
      onLogin(true);
    } else {
      setError('Неверные учетные данные');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="card bg-slate-800/50 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-emerald-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-emerald-primary" />
          </div>
          <h1 className="text-2xl font-bold text-emerald-light">Админ Панель</h1>
          <p className="text-slate-400 mt-2">Пожалуйста, войдите для продолжения</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 rounded-md p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">
              Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200"
              placeholder="admin"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-200"
              placeholder="admin"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-primary text-white py-2 px-4 rounded-md hover:bg-emerald-dark focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}