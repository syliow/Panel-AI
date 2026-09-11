'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ListeningIndicatorProps {
  subscribeToVolume: (callback: (vol: number) => void) => () => void;
}

export const ListeningIndicator: React.FC<ListeningIndicatorProps> = ({ subscribeToVolume }) => {
  const [isReceivingAudio, setIsReceivingAudio] = useState(false);

  // Use a ref to prevent stale closures in the subscription callback if needed,
  // though here we only update state based on a threshold.

  useEffect(() => {
    const unsubscribe = subscribeToVolume((vol) => {
      // Update state only when crossing the threshold to minimize re-renders
      // Using 0.01 as a small threshold to avoid noise
      const isActive = vol > 0.01;
      setIsReceivingAudio(prev => {
        if (prev !== isActive) return isActive;
        return prev;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeToVolume]);

  return (
    <div className="flex justify-center flex-col items-center gap-4">
      <div className="relative">
        {isReceivingAudio && (
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
        )}
        <div className={`relative p-6 rounded-full transition-colors duration-300 ${isReceivingAudio ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 transition-colors duration-300 ${isReceivingAudio ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
      </div>

      {/* Mic Status Label */}
      {isReceivingAudio ? (
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest animate-pulse">
              Listening...
          </span>
      ) : (
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Waiting for audio...
          </span>
      )}
    </div>
  );
};
