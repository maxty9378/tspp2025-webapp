import React from 'react';
import { Trophy } from 'lucide-react';
import { UserCard } from '../components/UserCard';
import { useUsers } from '../hooks/useUsers';
import { TelegramUser } from '../types';
import { SkeletonUserCard } from '../components/SkeletonUserCard';
import { PageHeader } from '../components/PageHeader';

interface UsersPageProps {
  currentUser: TelegramUser | null;
}

export function UsersPage({ currentUser }: UsersPageProps) {
  const { users, loading, error } = useUsers();

  if (error) {
    return (
      <div className="card bg-red-900/20 border-red-500/30 p-4 text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Рейтинг участников" icon={Trophy}>
        <p className="text-emerald-primary/80 text-sm mt-1">
          Соревнуйтесь и зарабатывайте баллы!
        </p>
      </PageHeader>

      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <SkeletonUserCard key={i} />
          ))
        ) : users.length > 0 ? (
          users.map((user, index) => (
            <div key={user.id} className="relative animate-fadeIn">
              <div 
                className={`absolute -left-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${
                  index < 3 
                    ? 'border-2 border-slate-800'
                    : 'bg-slate-800/80 text-slate-300'
                }`}
                style={{
                  backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : undefined,
                  color: index === 0 ? '#000' : '#FFF'
                }}
              >
                {index + 1}
              </div>
              <UserCard 
                user={user} 
                isCurrentUser={currentUser ? user.id === currentUser.id.toString() : false}
              />
            </div>
          ))
        ) : (
          <div className="card p-4 text-center text-slate-400">
            Пока нет участников
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersPage;