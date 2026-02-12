import React, { useState, useEffect, useRef } from 'react';

interface MicStatusProps {
  subscribeToVolume: (callback: (vol: number) => void) => () => void;
}

export const MicStatus: React.FC<MicStatusProps> = ({ subscribeToVolume }) => {
  const [isListening, setIsListening] = useState(false);

  // Ref to track current value to avoid stale closure in subscription
  const isListeningRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToVolume((vol) => {
      const listening = vol > 0;
      if (listening !== isListeningRef.current) {
        isListeningRef.current = listening;
        setIsListening(listening);
      }
    });
    return unsubscribe;
  }, [subscribeToVolume]);

  return (
    <div className="flex justify-center flex-col items-center gap-4">
      <div className="relative">
        {isListening && (
           <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
        )}
        <div className={`relative p-6 rounded-full transition-colors duration-300 ${isListening ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 transition-colors duration-300 ${isListening ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
      </div>

      {/* Mic Status Label */}
      {isListening ? (
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
