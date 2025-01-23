import React from 'react';

export function VideoBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10" />
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.3)' }}
      >
        <source
          src="https://cdn.jsdelivr.net/gh/maxkadochnikov/assets/neural-bg.mp4"
          type="video/mp4"
        />
      </video>
    </div>
  );
}