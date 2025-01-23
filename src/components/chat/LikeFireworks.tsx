// src/components/chat/LikeFireworks.tsx
import React from 'react';
import Confetti from 'react-confetti';

interface LikeFireworksProps {
  show: boolean;
  onComplete?: () => void;
}

export function LikeFireworks({ show, onComplete }: LikeFireworksProps) {
  if (!show) return null;

  return (
    <Confetti
      width={window.innerWidth}
      height={window.innerHeight}
      recycle={false}
      numberOfPieces={100}
      colors={['#ef4444', '#f87171', '#fca5a5']}
      onConfettiComplete={onComplete}
    />
  );
}
