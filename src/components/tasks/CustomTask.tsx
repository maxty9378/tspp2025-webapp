import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Task } from '../../hooks/useTasks';
import { TaskCompletion } from '../../types';
import { AOSTask } from './AOSTask';
import { POINTS_CONFIG } from '../../services/pointsService';

interface CustomTaskProps {
  task: Task;
  isCompleted: boolean;
  completions: TaskCompletion[];
  onRemoveCompletion: (completionId: string) => void;
  userId: string;
}

export function CustomTask({ 
  task, 
  isCompleted, 
  completions, 
  onRemoveCompletion,
  userId 
}: CustomTaskProps) {
  const taskCompletions = completions.filter(c => 
    c.metadata?.task_id === task.id
  );
  const userCompletion = taskCompletions.find(c => c.user_id === userId);
  const isAdminTask = task.points > POINTS_CONFIG.CUSTOM_TASK_MAX;

  // Handle AOS task type
  if (task.type === 'aos') {
    return (
      <AOSTask
        programId={task.program_id}
        programTitle={task.title}
        userId={userId}
        onComplete={() => {
          // Refresh task completions after AOS submission
          onRemoveCompletion(userCompletion?.id || '');
        }}
      />
    );
  }

  return (
    <div 
      className={`p-4 rounded-lg ${
        isCompleted
          ? 'bg-emerald-500/10 border border-emerald-500/20' 
          : isAdminTask
            ? 'bg-indigo-500/10 border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/20'
            : 'bg-slate-800/50 border border-slate-700/30 cursor-pointer hover:bg-slate-800/70'
      } transition-colors`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isCompleted
            ? 'bg-emerald-500/20'
            : isAdminTask
              ? 'bg-indigo-500/20'
            : 'bg-slate-700/50'
        }`}>
          <CheckCircle className={`w-4 h-4 ${
            isCompleted
              ? 'text-emerald-400'
              : isAdminTask
                ? 'text-indigo-400'
              : 'text-slate-400'
          }`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${
              isCompleted
                ? 'text-emerald-300'
                : isAdminTask
                  ? 'text-indigo-300'
                : 'text-slate-300'
            }`}>
              {task.title}
              {isAdminTask && (
                <span className="ml-2 text-xs text-amber-400">
                  Повышенные баллы
                </span>
              )}
            </h4>
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="text-sm font-medium">+{task.points}</span>
            </div>
          </div>
          <p className="text-sm text-slate-400">{task.description}</p>
          {isCompleted && userCompletion && (
            <div className="mt-2 flex -space-x-2 overflow-hidden">
              <div
                className="relative group hover:z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Удалить отметку о выполнении?')) {
                    onRemoveCompletion(userCompletion.id);
                  }
                }}
              >
                <img
                  src={userCompletion.user?.photo_url || `https://ui-avatars.com/api/?name=${userCompletion.user?.first_name || 'U'}`}
                  alt={userCompletion.user?.first_name || 'User'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-900 hover:ring-emerald-primary/50 transition-all transform hover:scale-110"
                  title={`${userCompletion.user?.first_name || 'User'} ${userCompletion.user?.last_name || ''}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}