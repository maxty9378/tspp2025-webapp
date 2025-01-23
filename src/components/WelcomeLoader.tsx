import React from 'react';
import { User } from 'lucide-react';

export function WelcomeLoader() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-center flex-col">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
              <User className="w-12 h-12 text-blue-200" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <div className="mt-4 text-center">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mx-auto mt-2" />
          </div>
        </div>
        <div className="flex justify-center mt-4 space-x-2">
          <div className="h-6 w-20 bg-blue-50 rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-blue-50 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse mt-2" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="aspect-w-16 aspect-h-9 bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
        </div>
      </div>
    </div>
  );
}