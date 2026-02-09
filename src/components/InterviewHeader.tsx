'use client';

import React from 'react';
import { InterviewConfig, ConnectionStatus } from '@/types';
import { MAX_INTERVIEW_DURATION } from '@/constants';

interface InterviewHeaderProps {
  config: InterviewConfig;
  status: ConnectionStatus;
  hasStarted: boolean;
  duration: number;
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const InterviewHeader = React.memo<InterviewHeaderProps>(({ config, status, hasStarted, duration }) => {
  return (
    <div className="relative w-full max-w-[90%] mx-auto mt-4 md:absolute md:top-4 md:left-1/2 md:mt-0 md:-translate-x-1/2 md:w-auto z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 shadow-sm flex items-center justify-between md:justify-start gap-4">
       {/* Job Info */}
       <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-700 overflow-hidden">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white truncate max-w-[120px] md:max-w-[150px]">
             {config.jobTitle}
          </span>
          <span className="hidden sm:inline px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 rounded">
             {config.interviewType}
          </span>
       </div>

       {/* Status & Timer */}
       <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : status === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></div>
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest tabular-nums text-slate-600 dark:text-slate-300">
             {hasStarted ? `${formatDuration(duration)} / ${formatDuration(MAX_INTERVIEW_DURATION)}` : 'Ready'}
          </span>
       </div>
    </div>
  );
});

InterviewHeader.displayName = 'InterviewHeader';
