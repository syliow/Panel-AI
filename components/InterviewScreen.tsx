import React, { useEffect, useRef, useState } from 'react';
import { InterviewConfig, TranscriptItem } from '../types';
import { ControlBar } from './ControlBar';
import { TranscriptMessage } from './TranscriptMessage';
import { QuotaModal } from './QuotaModal';
import { MAX_INTERVIEW_DURATION } from '../constants';
import { useInterviewSession } from '../hooks/useInterviewSession';

interface InterviewScreenProps {
  config: InterviewConfig;
  onEndSession: (transcript: TranscriptItem[]) => void;
}

export const InterviewScreen: React.FC<InterviewScreenProps> = ({ config, onEndSession }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState(5);

  const {
    status,
    error,
    transcript,
    isMuted,
    volume,
    isAiSpeaking,
    duration,
    isEnding,
    endReason,
    showQuotaModal,
    setShowQuotaModal,
    toggleMute,
    handleEndCall,
    stopTimer
  } = useInterviewSession(config, onEndSession);

  // Auto-scroll effect
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // UI specific countdown for ending
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEndStatusMessage = () => {
      switch (endReason) {
          case 'timeout': return "Time Limit Reached.";
          case 'inactivity': return "Session Timeout.";
          default: return "Interview Concluded.";
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-black min-h-0 relative transition-colors duration-500">
      <QuotaModal isOpen={showQuotaModal} onClose={() => setShowQuotaModal(false)} />

      {/* Auto-Disconnect Overlay */}
      {isEnding && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-sm animate-fade-in">
            <div className="text-center px-6">
                <div className="text-8xl font-black text-black dark:text-white mb-6 animate-pulse">{countdown}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    {getEndStatusMessage()}
                </div>
                
                {endReason === 'inactivity' && (
                    <div className="text-xs font-medium text-red-500 mb-4">
                        No activity detected for 3 minutes.
                    </div>
                )}
                 {endReason === 'timeout' && (
                    <div className="text-xs font-medium text-red-500 mb-4">
                        Maximum interview duration of 20 minutes exceeded.
                    </div>
                )}

                <div className="text-xs font-mono text-slate-400 mt-2">Generating Feedback Report...</div>
                
                <button 
                   onClick={handleEndCall}
                   className="mt-10 px-8 py-3 bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity text-xs font-bold uppercase tracking-widest"
                >
                    End Now
                </button>
            </div>
        </div>
      )}

      {/* Session Context Header */}
      <header className="flex-none border-b border-slate-100 dark:border-slate-900 px-8 py-5 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 transition-colors duration-300">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-none">{config.jobTitle}</h2>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {config.interviewType} {config.difficulty ? ` // ${config.difficulty}` : ''}
              </div>
            </div>
            {status === 'connected' && (
              <div className={`bg-slate-100 dark:bg-slate-900 px-3 py-1 text-[10px] font-mono font-bold transition-colors ${
                  duration > MAX_INTERVIEW_DURATION - 60 ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'
              }`}>
                {formatDuration(duration)}
              </div>
            )}
          </div>
          
          <div className={`text-[10px] font-black uppercase tracking-widest ${status === 'error' ? 'text-red-500' : 'text-slate-300 dark:text-slate-600'}`}>
             {status === 'connected' ? 'LIVE SESSION' : status === 'error' ? 'CONNECTION ERROR' : 'INITIALIZING...'}
          </div>
        </div>
      </header>

      {/* Transcript Area */}
      <div 
        className="flex-grow overflow-y-auto px-4 md:px-0 py-8 scrollbar-hide min-h-0" 
        ref={scrollRef}
      >
        <div className="max-w-3xl mx-auto pb-10">
            {transcript.length === 0 && status === 'connected' && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-300 dark:text-slate-700 animate-fade-in">
                    <p className="text-xs font-bold tracking-[0.2em] uppercase">Say "Hello" to begin</p>
                </div>
            )}
            
            {status === 'error' && (
                <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in px-6">
                    <p className="text-lg font-bold text-red-500 mb-2">Connection Failed</p>
                    <p className="text-sm text-slate-500 mb-6">{error || 'Please check your network and try again.'}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                    >
                        Return to Setup
                    </button>
                </div>
            )}

            {transcript.map((item, index) => (
                <TranscriptMessage 
                    key={item.id} 
                    item={item} 
                    isSpeaking={isAiSpeaking && item.speaker === 'AI' && index === transcript.length - 1}
                />
            ))}
        </div>
      </div>

      {/* Controls */}
      <div className="backdrop-blur-md bg-white/90 dark:bg-black/90 transition-colors duration-300">
        <ControlBar 
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onEndCall={handleEndCall}
            isActive={status === 'connected'}
            volumeLevel={volume}
        />
      </div>
    </div>
  );
};