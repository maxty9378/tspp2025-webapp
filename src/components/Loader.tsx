import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  text?: string;
}

export function Loader({ text }: LoaderProps) {
  return (
    <div className="animate-fadeIn bg-white rounded-lg shadow-md p-8 text-center">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        {text && <p className="mt-4 text-gray-600">{text}</p>}
      </div>
    </div>
  );
}