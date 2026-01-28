import React from 'react';

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuotaModal: React.FC<QuotaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm animate-fade-in p-6">
      <div className="w-full max-w-md bg-white dark:bg-black border-2 border-red-500 shadow-2xl p-8 transform transition-all scale-100">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Daily Limit Reached
          </h2>
          
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            The API quota for this key has been exhausted for the day. Google sets daily limits to prevent abuse.
          </p>
          
          <div className="w-full pt-4">
            <p className="text-xs font-mono text-slate-400 mb-6">
                Please try again later or use a different API key.
            </p>
            
            <button
              onClick={onClose}
              className="w-full py-3 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};