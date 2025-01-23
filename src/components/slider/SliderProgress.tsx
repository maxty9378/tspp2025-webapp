import React from 'react';
import { motion } from 'framer-motion';

interface SliderProgressProps {
  total: number;
  current: number;
  onChange: (index: number) => void;
}

export function SliderProgress({ total, current, onChange }: SliderProgressProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <motion.button
          key={index}
          onClick={() => onChange(index)}
          className={`w-2 h-2 rounded-full transition-all ${
            index === current 
              ? 'bg-white w-4' 
              : 'bg-white/50 hover:bg-white/80'
          }`}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
        />
      ))}
    </div>
  );
}