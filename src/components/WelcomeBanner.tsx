import React from 'react';
import { motion } from 'framer-motion';

export function WelcomeBanner() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative h-[280px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-transparent shadow-lg"
    >
      {/* Background Video with Gradient Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://static.tildacdn.com/tild3738-3865-4138-a339-666333653732/___2025-3.jpg"
          alt="ТСПП2025"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.7)' }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative z-20 h-full flex flex-col items-center justify-center p-4 text-center mt-12"
      >
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-emerald-500 mb-6">
          ТСПП<span className="text-emerald-400">2025</span>
        </h1>

        {/* Decorative Elements */}
        <div className="flex items-center gap-3 mt-6">
          <div className="w-12 h-1 rounded-full bg-emerald-500/20" />
          <div className="text-xl text-emerald-300/80 font-medium">
            Добро пожаловать
          </div>
          <div className="w-12 h-1 rounded-full bg-emerald-500/20" />
        </div>
      </motion.div>

      {/* Decorative Circles */}
      <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
    </motion.div>
  );
}