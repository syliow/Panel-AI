import React from 'react';

interface ControlBarProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
  isActive: boolean;
  volumeLevel: number;
}

export const ControlBar: React.FC<ControlBarProps> = ({ 
  isMuted, 
  onToggleMute, 
  onEndCall, 
  isActive,
  volumeLevel 
}) => {
  return (
    <div className="flex-none bg-white/90 dark:bg-black/90 border-t border-slate-100 dark:border-slate-900 p-6 z-10 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        
        {/* Status Indicator */}
        <div className="w-1/3 flex items-center gap-3">
           {isActive && (
            <div className="flex items-center gap-2">
               <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live</span>
            </div>
           )}
        </div>

        {/* Main Controls */}
        <div className="w-1/3 flex items-center justify-center gap-6 md:gap-8">
          
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`group relative flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-full border transition-all duration-300 ${
              isMuted 
                ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/10 shadow-lg shadow-red-500/10' 
                : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-black dark:hover:border-white shadow-lg'
            }`}
          >
             {/* Volume visualizer ring */}
             {!isMuted && isActive && (
                <div 
                    className="absolute inset-0 rounded-full border border-slate-900 dark:border-white opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ transform: `scale(${1 + (volumeLevel * 0.5)})`}}
                />
            )}

            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                 <line x1="3" y1="3" x2="21" y2="21" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors duration-300 shadow-lg shadow-red-600/20"
            title="End Interview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Spacer to keep center alignment */}
        <div className="w-1/3"></div>
      </div>
    </div>
  );
};