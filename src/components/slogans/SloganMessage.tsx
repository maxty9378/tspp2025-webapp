import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { UserProfile } from '../../types';
import { SloganForm } from './SloganForm';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';

interface SloganMessageProps {
  user: UserProfile;
  onUpdate: () => void;
}

export function SloganMessage({ user, onUpdate }: SloganMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canPost = true; // Always allow editing

  const refreshSlogan = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('messages')
        .select('text')
        .eq('user_id', user.id)
        .eq('type', 'slogan')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setMessage(data?.text || null);
    } catch (error) {
      console.error('Error fetching slogan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSlogan();
  }, [user.id]);

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-emerald-primary" />
        </div>
        <div>
          <h3 className="font-medium text-emerald-light">Слоган</h3>
          <p className="text-sm text-slate-400">
            {message ? 'Нажмите для редактирования' : 'Придумайте слоган для конференции (+10 баллов)'}
          </p>
        </div>
      </div>

      {isEditing ? (
        <SloganForm
          user={user}
          canPost={canPost}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => {
            refreshSlogan();
            setIsEditing(false);
            onUpdate();
          }}
        />
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className={`p-3 bg-slate-800/50 rounded-lg transition-colors cursor-pointer hover:bg-slate-800 ${
            isLoading ? 'opacity-50' : ''
          }`}
        >
          {message && <span className="text-xs text-slate-400 block mb-1">Нажмите для редактирования</span>}
          <p className="text-sm text-slate-300">
            {isLoading ? 'Загрузка...' : message || 'Нажмите, чтобы добавить слоган'}
          </p>
        </div>
      )}
    </div>
  );
}