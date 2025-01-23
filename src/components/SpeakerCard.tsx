import React, { useState } from 'react';
import { User } from 'lucide-react';

interface SpeakerProps {
  name: string;
  position: string;
  photoUrl?: string;
}

export function SpeakerCard({ name, position, photoUrl }: SpeakerProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="flex items-center gap-3 p-3">
      {photoUrl && !imageError ? (
        <img
          src={photoUrl}
          alt={name}
          onError={handleImageError}
          className="w-10 h-10 rounded-lg object-cover ring-1 ring-emerald-primary/20"
          loading="lazy"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-emerald-primary/70" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-emerald-light text-sm truncate">{name}</div>
        <div className="text-xs text-slate-400 truncate leading-normal">{position}</div>
      </div>
    </div>
  );
}