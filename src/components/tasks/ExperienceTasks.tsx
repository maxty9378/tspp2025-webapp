import React from 'react';
import { MessageSquare, CheckCircle, BookOpen, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExperienceTasksProps {
  hasCompletedPractice: boolean;
  hasCompletedMistake: boolean;
  onTaskClick: (type: 'practice' | 'mistake') => void;
}

export function ExperienceTasks({ 
  hasCompletedPractice, 
  hasCompletedMistake, 
  onTaskClick 
}: ExperienceTasksProps) {
  return (
    <div className="mt-8">
      <div className="card p-4 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 border border-amber-500/10 relative overflow-hidden">
        {/* Decorative background icons */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          {/* Top row */}
          <div className="absolute -right-2 -top-2 transform rotate-12">
            <BookOpen className="w-12 h-12" />
          </div>
          <div className="absolute right-8 top-1 transform rotate-6">
            <MessageSquare className="w-10 h-10" />
          </div>
          <div className="absolute right-16 -top-1 transform -rotate-12">
            <BookOpen className="w-8 h-8" />
          </div>
          
          {/* Middle row */}
          <div className="absolute left-1/4 top-1/2 transform -translate-y-1/2 rotate-6">
            <MessageSquare className="w-10 h-10" />
          </div>
          <div className="absolute right-1/4 top-1/2 transform -translate-y-1/2 -rotate-12">
            <BookOpen className="w-12 h-12" />
          </div>
          
          {/* Bottom row */}
          <div className="absolute -left-2 -bottom-2 transform -rotate-12">
            <BookOpen className="w-10 h-10" />
          </div>
          <div className="absolute left-8 bottom-1 transform rotate-12">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="absolute left-16 -bottom-1 transform -rotate-6">
            <BookOpen className="w-10 h-10" />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-medium text-amber-300">Делимся мыслями</h3>
            <p className="text-sm text-slate-400">
              Поделитесь своим опытом и знаниями
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* Practice Experience */}
          <div 
            onClick={() => !hasCompletedPractice && onTaskClick('practice')} 
            className={`p-3 ${
              hasCompletedPractice 
                ? 'bg-emerald-500/10 border border-emerald-500/20 opacity-75 cursor-default' 
                : 'bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 hover:scale-[1.02] active:scale-95'
            } rounded-lg transition-all relative`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center relative">
                {hasCompletedPractice ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                )}
                {hasCompletedPractice && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  </div>
                )}
              </div>
              <div>
                <h4 className={`font-medium text-sm mb-0.5 ${
                  hasCompletedPractice ? 'text-emerald-300' : 'text-amber-300'
                }`}>Поделитесь опытом</h4>
                <p className={`text-xs ${
                  hasCompletedPractice ? 'text-emerald-300/60' : 'text-slate-400'
                }`}>
                  {hasCompletedPractice 
                    ? 'Задание выполнено' 
                    : '+50 баллов за историю'}
                </p>
              </div>
            </div>
          </div>

          {/* Mistake Experience */}
          <div 
            onClick={() => !hasCompletedMistake && onTaskClick('mistake')} 
            className={`p-3 ${
              hasCompletedMistake
                ? 'bg-emerald-500/10 border border-emerald-500/20 opacity-75 cursor-default'
                : 'bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 hover:scale-[1.02] active:scale-95'
            } rounded-lg transition-all relative`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center relative">
                {hasCompletedMistake ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                )}
                {hasCompletedMistake && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  </div>
                )}
              </div>
              <div>
                <h4 className={`font-medium text-sm mb-0.5 ${
                  hasCompletedMistake ? 'text-emerald-300' : 'text-amber-300'
                }`}>Поделитесь уроком</h4>
                <p className={`text-xs ${
                  hasCompletedMistake ? 'text-emerald-300/60' : 'text-slate-400'
                }`}>
                  {hasCompletedMistake
                    ? 'Задание выполнено'
                    : '+50 баллов за историю'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}