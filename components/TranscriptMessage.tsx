import React from 'react';
import { TranscriptItem } from '../types';

interface TranscriptMessageProps {
  item: TranscriptItem;
}

export const TranscriptMessage: React.FC<TranscriptMessageProps> = ({ item }) => {
  const isAI = item.speaker === 'AI';

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex w-full mb-6 animate-fade-in ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`relative max-w-[85%] md:max-w-[75%] lg:max-w-[65%] flex flex-col p-5 border ${
          isAI 
            ? 'bg-white dark:bg-black border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100' 
            : 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black' 
        }`}
      >
        {/* Header: Speaker & Time */}
        <div className={`flex items-center gap-3 mb-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
            <span className={`text-[9px] font-black uppercase tracking-widest ${
                isAI ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'
            }`}>
                {isAI ? 'AI Interviewer' : 'Candidate'}
            </span>
            <span className="text-[9px] font-mono text-slate-300 dark:text-slate-600">
                {formatTime(item.timestamp)}
            </span>
        </div>

        {/* Text Content */}
        <div className="text-sm md:text-base font-normal leading-relaxed">
          {item.text}
          
          {/* Typing Indicator */}
          {item.isPartial && (
             <span className="inline-flex items-center gap-1 ml-2 align-baseline">
                <span className={`w-1 h-1 rounded-full animate-bounce [animation-delay:-0.3s] ${isAI ? 'bg-slate-400' : 'bg-slate-500'}`}></span>
                <span className={`w-1 h-1 rounded-full animate-bounce [animation-delay:-0.15s] ${isAI ? 'bg-slate-400' : 'bg-slate-500'}`}></span>
                <span className={`w-1 h-1 rounded-full animate-bounce ${isAI ? 'bg-slate-400' : 'bg-slate-500'}`}></span>
             </span>
          )}
        </div>
      </div>
    </div>
  );
};