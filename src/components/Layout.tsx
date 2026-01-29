'use client';

import React from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
  onShowGuide?: () => void;
  hideSpotlight?: boolean;
  hideGrid?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onShowGuide, 
  hideSpotlight = false,
  hideGrid = false
}) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-black text-slate-900 dark:text-slate-50 transition-colors duration-300 relative selection:bg-slate-200 dark:selection:bg-slate-800 font-sans">
      
      {/* --- Background System --- */}
      <div className="absolute inset-0 z-0 bg-white dark:bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000000_100%)] transition-colors duration-500" />
      
      {/* Grid Pattern */}
      {!hideGrid && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.07] dark:opacity-[0.15]" 
             style={{ 
               backgroundSize: '40px 40px',
               backgroundImage: `
                 linear-gradient(to right, #888 1px, transparent 1px),
                 linear-gradient(to bottom, #888 1px, transparent 1px)
               `,
             }}>
        </div>
      )}

      {/* Ambient Spotlight */}
      {!hideSpotlight && (
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.03),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
      )}

      {/* --- Global Header --- */}
      <header className="flex-none h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-50 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <Logo className="h-5 w-5 md:h-6 md:w-6 text-black dark:text-white" />
          <span className="font-black tracking-tighter text-lg md:text-xl text-slate-900 dark:text-white uppercase">Panel AI</span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={onShowGuide}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">How it works?</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative min-h-0 z-10">
        {children}
      </main>

      {/* Global Footer - Ultra Thin Layout */}
      <footer className="flex-none py-2 border-t border-slate-100 dark:border-slate-900 bg-white/80 dark:bg-black/80 backdrop-blur-md z-50 transition-colors duration-300">
        <div className="px-4 md:px-6 flex flex-row items-center justify-between">
          
          {/* Left: Brand & Mic Status */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 pr-3 md:pr-4 border-r border-slate-200 dark:border-slate-800">
              <Logo className="h-2.5 w-2.5 text-slate-400 dark:text-slate-600" />
              <span className="hidden sm:inline text-[9px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-600">Panel AI</span>
            </div>
            
            <div className="flex items-center gap-2 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors whitespace-nowrap">Mic Access Required</span>
            </div>
          </div>

          {/* Right: Attribution & Socials Inline */}
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-[9px] md:text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Developed by <a href="https://liowshanyi.site" target="_blank" rel="noopener noreferrer" className="text-slate-900 dark:text-white hover:underline font-bold transition-all">Shanyi Liow</a>
            </span>
            
            <div className="flex items-center gap-2 md:gap-3 text-slate-400">
               <a href="https://github.com/syliow" target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:text-black dark:hover:text-white transition-transform hover:scale-110">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
               </a>
               <a href="https://linkedin.com/in/syliow" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="hover:text-[#0077b5] transition-transform hover:scale-110">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
               </a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};
