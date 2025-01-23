import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  icon: LucideIcon;
  children?: React.ReactNode;
}

export function PageHeader({ title, icon: Icon, children }: PageHeaderProps) {
  return (
    <motion.div 
      className="card bg-emerald-gradient-subtle p-4 mb-6 overflow-hidden"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        {/* Decorative bullet points */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          <div className="w-0.5 h-6 bg-emerald-primary/20 rounded-full" />
          <div className="w-0.5 h-3 bg-emerald-primary/10 rounded-full" />
          <div className="w-0.5 h-2 bg-emerald-primary/5 rounded-full" />
        </div>

        <div className="flex items-center justify-between pl-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[1.25rem] bg-emerald-primary/10 flex items-center justify-center backdrop-blur-lg">
              <Icon className="w-5 h-5 text-emerald-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-emerald-light">{title}</h1>
              {children}
            </div>
          </div>

          {/* Decorative bullet points on right */}
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-end">
            <div className="w-0.5 h-6 bg-emerald-primary/20 rounded-full" />
            <div className="w-0.5 h-3 bg-emerald-primary/10 rounded-full" />
            <div className="w-0.5 h-2 bg-emerald-primary/5 rounded-full" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}