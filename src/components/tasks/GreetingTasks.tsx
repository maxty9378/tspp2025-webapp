import React from 'react';
import { UserProfile } from '../../types';
import { GreetingMessage } from '../greetings/GreetingMessage';
import { SloganMessage } from '../slogans/SloganMessage';
import { CheckCircle, MessageSquare, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

interface GreetingTasksProps {
  user: UserProfile;
  hasCompletedGreetingTasks: boolean;
}

export function GreetingTasks({ user, hasCompletedGreetingTasks }: GreetingTasksProps) {
  const hasGreeting = Boolean(user.greeting_message);
  const hasSlogan = Boolean(user.slogan);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 border-2 border-emerald-500/20 relative overflow-hidden"
    >
      {/* Background Icons */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute -right-4 -top-4 transform rotate-12">
          <MessageSquare className="w-24 h-24 text-emerald-500" />
        </div>
        <div className="absolute -left-4 -bottom-4 transform -rotate-12">
          <Quote className="w-24 h-24 text-emerald-500" />
        </div>
      </div>

      {/* Content */}
      <div className="relative space-y-6">
        {/* Greeting/Quote Section */}
        <div className="relative">
          <GreetingMessage user={user} onUpdate={() => {}} />
          {hasGreeting && (
            <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-300 p-1.5 rounded-full">
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Slogan Section */}
        <div className="relative">
          <SloganMessage user={user} onUpdate={() => {}} />
          {hasSlogan && (
            <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-300 p-1.5 rounded-full">
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Completion Status */}
      {hasCompletedGreetingTasks && (
        <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm">
          Выполнено
        </div>
      )}
    </motion.div>
  );
}