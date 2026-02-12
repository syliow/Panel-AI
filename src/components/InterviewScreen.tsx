'use client';

import React, { useEffect, useRef, useState } from 'react';
import { InterviewConfig, TranscriptItem } from '@/types';
import { ControlBar } from './ControlBar';
import { TranscriptList } from './TranscriptList';
import { QuotaModal } from './QuotaModal';
import { RateLimitModal } from './RateLimitModal';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { InterviewHeader } from './InterviewHeader';
import { useTurnstile } from './Turnstile';

interface InterviewScreenProps {
  config: InterviewConfig;
  onEndSession: (transcript: TranscriptItem[]) => void;
}

export const InterviewScreen: React.FC<InterviewScreenProps> = ({ config, onEndSession }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState(5);
  const { token, TurnstileWidget } = useTurnstile();

  const {
    status,
    error,
    transcript,
    isMuted,
    volume,
    isAiSpeaking,
    duration,
    hasStarted,
    isEnding,
    setIsEnding,
    endReason,
    showQuotaModal,
    setShowQuotaModal,
    showRateLimitModal,
    setShowRateLimitModal,
    rateLimitType,
    toggleMute,
    handleEndCall,
    startInterview,
    stopTimer
  } = useInterviewSession(config, onEndSession);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    let countdownInterval: number;
    if (isEnding) {
      stopTimer();
      if (countdown > 0) {
        countdownInterval = window.setInterval(() => setCountdown(p => p - 1), 1000);
      } else if (countdown === 0) {
        handleEndCall();
      }
    }
    return () => clearInterval(countdownInterval);
  }, [isEnding, countdown, handleEndCall, stopTimer]);

  const getEndStatusMessage = () => {
      switch (endReason) {
        case 'timeout': return 'Time Limit Reached';
        case 'inactivity': return 'Session Timeout (Inactivity)';
        case 'manual': return 'Ending Session...';
        default: return 'Session Ended';
      }
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-black transition-colors w-full">
      <QuotaModal isOpen={showQuotaModal} onClose={() => setShowQuotaModal(false)} />

      {/* Header Info Bar - Shows job title, interview type, and timer */}
      <InterviewHeader
        config={config}
        status={status}
        hasStarted={hasStarted}
        duration={duration}
      />

      {/* Transcript Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 md:pt-20 scrollbar-hide flex flex-col items-center w-full" ref={scrollRef}>
          <div className="w-full max-w-3xl flex flex-col justify-end min-h-full pb-4">
            
            {/* Pre-start state - Show Start button */}
            {!hasStarted && (
                <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                   <div className="text-center space-y-8">
                      {/* Interview Info */}
                      <div className="space-y-2">
                         <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {config.jobTitle}
                         </h2>
                         <p className="text-sm text-slate-500 dark:text-slate-400">
                            {config.interviewType} Interview {config.difficulty && `• ${config.difficulty}`}
                         </p>
                      </div>

                      
                      <button
                         onClick={() => startInterview(token)}
                         disabled={!token}
                         className={`group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-black dark:bg-white text-white dark:text-black text-sm font-bold uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl hover:scale-105 ${!token ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                         {token ? (
                           <>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                             </svg>
                             Start Interview
                           </>
                         ) : (
                           <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Verifying...
                           </>
                         )}
                      </button>
                      
                      {/* Simple hint */}
                      <p className="text-xs text-slate-400 dark:text-slate-600 max-w-xs mx-auto text-center">
                        Click the button above to begin your interview
                      </p>

                      <div className="absolute opacity-0 pointer-events-none">
                         <TurnstileWidget size="invisible" />
                      </div>
                   </div>
                </div>
            )}
            
            {/* Connecting state */}
            {hasStarted && status === 'connecting' && transcript.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center">
                   <div className="text-center space-y-4">
                      <div className="flex justify-center gap-1">
                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                         Connecting to interviewer...
                      </p>
                   </div>
                </div>
            )}
            
            {/* Connected - waiting for user to greet */}
            {hasStarted && status === 'connected' && transcript.length === 0 && !isAiSpeaking && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                   <div className="text-center space-y-6 max-w-md">
                      {/* Microphone icon with status feedback */}
                      <div className="flex justify-center flex-col items-center gap-4">
                        <div className="relative">
                          {volume > 0 && (
                             <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                          )}
                          <div className={`relative p-6 rounded-full transition-colors duration-300 ${volume > 0 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 transition-colors duration-300 ${volume > 0 ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Mic Status Label */}
                        {volume > 0 ? (
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest animate-pulse">
                                Listening...
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Waiting for audio...
                            </span>
                        )}
                      </div>
                      
                      {/* Instruction */}
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          Ready to Start
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Say <span className="font-bold text-emerald-600 dark:text-emerald-400">&quot;Hello&quot;</span>, <span className="font-bold text-emerald-600 dark:text-emerald-400">&quot;Start&quot;</span>, or <span className="font-bold text-emerald-600 dark:text-emerald-400">&quot;Hi&quot;</span> to begin the interview
                        </p>
                        
                        {/* Permission Hint */}
                        <p className="text-xs text-amber-500 mt-2 font-medium">
                           ⚠️ Ensure microphone permission is allowed
                        </p>
                      </div>
                   </div>
                </div>
            )}
            
            {/* Transcript messages */}
            {transcript.length > 0 && (
                <TranscriptList
                    transcript={transcript}
                    isAiSpeaking={isAiSpeaking}
                />
            )}

            {error && (
                <div className="w-full text-center p-4 my-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-xs font-bold animate-fade-in">
                    {error}
                </div>
            )}
          </div>
      </div>

      {/* Ending Overlay */}
      {isEnding && (
        <div className="absolute inset-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
           <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{getEndStatusMessage()}</p>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tabular-nums">
                  {countdown}
              </h2>
              <button onClick={handleEndCall} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">
                  End Now
              </button>
           </div>
        </div>
      )}

      {/* Controls - Only show after started */}
      {hasStarted && (
        <ControlBar 
          isMuted={isMuted} 
          onToggleMute={toggleMute} 
          onEndCall={() => setIsEnding(true)} 
          isActive={status === 'connected' && !isEnding}
          volumeLevel={volume}
        />
      )}

      {/* Rate Limit Modal */}
      <RateLimitModal 
        isOpen={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        limitType={rateLimitType}
      />
    </div>
  );
};
