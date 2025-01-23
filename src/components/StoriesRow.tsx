import React from 'react';
import { motion } from 'framer-motion';
import { useStories } from '../hooks/useStories';
import { AddStory } from './Stories/AddStory';

export function StoriesRow() {
  const { stories, loading } = useStories();

  if (loading) {
    return (
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-20 space-y-2 animate-pulse">
              <div className="w-20 h-20 bg-slate-800/50 rounded-2xl" />
              <div className="h-4 bg-slate-800/50 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 rounded-2xl" />
      
      <div className="relative overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4">
          <AddStory onClick={() => {}} isLoading={false} />
          {stories.map((story, index) => (
            <motion.button
              key={story.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-20 space-y-2"
            >
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                  <img
                    src={story.slides[0]?.media_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                {story.user.photo_url && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full ring-2 ring-slate-900">
                    <img
                      src={story.user.photo_url}
                      alt={story.user.first_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="text-center text-xs text-slate-400 truncate">
                {story.user.first_name}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}