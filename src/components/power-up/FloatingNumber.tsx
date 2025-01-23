import React from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface FloatingNumberProps {
  value: number;
  x: number;
  y: number;
}

export function FloatingNumber({ value, x, y }: FloatingNumberProps) {
  return (
    <motion.div
      initial={{ scale: 1, opacity: 1 }}
      animate={{ 
        scale: 0.5,
        y: -100,
        opacity: 0,
        x: Math.random() * 40 - 20 // Random horizontal movement
      }}
      transition={{ 
        duration: 1,
        ease: "easeOut"
      }}
      className="absolute flex items-center gap-1 text-amber-400 font-bold pointer-events-none z-50"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      <Coins className="w-4 h-4" />
      +{value}
    </motion.div>
  );
}