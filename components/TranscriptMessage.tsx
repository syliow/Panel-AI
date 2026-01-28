import React from 'react';
import { TranscriptItem } from '../types';

interface TranscriptMessageProps {
  item: TranscriptItem;
  isSpeaking?: boolean;
}

export const TranscriptMessage: React.FC<TranscriptMessageProps> = ({ item, isSpeaking }) => {
  const isAI = item.speaker === 'AI';

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex w-full mb-6 animate-fade-in ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`relative max-w-[85%] md:max-w-[75%] lg:max-w-[65%] flex flex-col p-5 border transition-all duration-300 rounded-2xl ${
          isAI 
            ? `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 ${item.isPartial ? 'opacity-90' : 'shadow-md'} rounded-tl-none` 
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tr-none shadow-sm' 
        } ${isSpeaking ? 'ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 border-indigo-200 dark:border-indigo-800' : ''}`}
      >
        {/* Header: Speaker & Time */}
        <div className={`flex items-center gap-3 mb-2 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
            <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                isAI ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
            }`}>
                {isAI ? 'AI Interviewer' : 'Candidate'}
                
                {/* Speaking Indicator */}
                {isSpeaking && isAI && (
                   <span className="relative flex h-2 w-2 ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                   </span>
                )}
            </span>
            <span className={`text-[9px] font-mono ${isAI ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                {formatTime(item.timestamp)}
            </span>
        </div>

        {/* Text Content */}
        <div className={`text-sm md:text-base leading-relaxed ${isAI ? 'font-normal' : 'font-medium'}`}>
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