import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTaskCompletions } from '../../hooks/useTaskCompletions';
import { useNavigate } from 'react-router-dom';
import { AOSTask } from './AOSTask';

interface AOSListProps {
  userId: string;
  programs: Array<{
    id: string;
    title: string;
    enabled: boolean;
  }>;
}

export function AOSList({ userId, programs }: AOSListProps) {
  const { completions, refetch } = useTaskCompletions();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-emerald-primary" />
        </div>
        <div>
          <h3 className="font-medium text-emerald-light">Анкеты обратной связи</h3>
          <p className="text-sm text-slate-400">
            Заполните АОС и получите баллы
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {programs.map(program => {
          const isCompleted = completions.aos?.some(c => 
            c.metadata?.program_id === program.id && 
            c.user?.id === userId
          );

          return (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                if (!isCompleted && program.enabled) {
                  navigate(`/aos/${program.id}`);
                }
              }}
              className={`card p-4 ${
                isCompleted 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : program.enabled
                    ? 'hover:bg-slate-800/70 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-emerald-light">
                    {program.title}
                  </h4>
                  <p className="text-sm text-slate-400">
                    {isCompleted 
                      ? 'АОС заполнена'
                      : program.enabled
                        ? '+30 баллов за заполнение'
                        : 'АОС недоступна'
                    }
                  </p>
                </div>
                {isCompleted && (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}