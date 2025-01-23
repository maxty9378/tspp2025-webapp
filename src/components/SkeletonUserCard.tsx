import React from 'react';

export function SkeletonUserCard() {
  return (
    <div className="card p-4 flex items-center space-x-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-[1.25rem] bg-slate-800 animate-pulse" />
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 animate-pulse" />
      </div>
      
      <div className="flex-1 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
          <div className="h-5 w-12 bg-slate-800 rounded-full animate-pulse" />
        </div>
        <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
        <div className="flex items-center space-x-3">
          <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-4 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}