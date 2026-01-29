import React, { useEffect, useRef, useState } from 'react';
import { InterviewConfig, TranscriptItem } from '../types.ts';
import { ControlBar } from './ControlBar.tsx';
import { TranscriptMessage } from './TranscriptMessage.tsx';
import { QuotaModal } from './QuotaModal.tsx';
import { MAX_INTERVIEW_DURATION } from '../constants.ts';
import { useInterviewSession } from '../hooks/useInterviewSession.ts';

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
    setIsEnding,
    endReason,
    showQuotaModal,
    setShowQuotaModal,
    toggleMute,
    handleEndCall,
    stopTimer
  } = useInterviewSession(config, onEndSession);

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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

      {/* Header Info Pill */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-full px-4 py-1.5 shadow-sm flex items-center gap-3">
         <div className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
         <span className="text-[10px] font-bold uppercase tracking-widest tabular-nums text-slate-600 dark:text-slate-300">
            {formatDuration(duration)} / {formatDuration(MAX_INTERVIEW_DURATION)}
         </span>
      </div>

      {/* Transcript Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 scrollbar-hide flex flex-col items-center w-full" ref={scrollRef}>
          <div className="w-full max-w-3xl flex flex-col justify-end min-h-full pb-4">
            {transcript.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                   <p className="text-xs font-bold uppercase tracking-widest text-slate-500 text-center">
                      Connecting to Interviewer...<br/>
                      <span className="text-[10px] font-normal opacity-70 mt-2 block">Please allow microphone access if prompted.</span>
                   </p>
                </div>
            ) : (
                transcript.map((item, index) => (
                    <TranscriptMessage 
                        key={item.id} 
                        item={item} 
                        isSpeaking={isAiSpeaking && item.speaker === 'AI' && index === transcript.length - 1} 
                    />
                ))
            )}
            
            {/* Visualizer / Status when connecting or empty */}
            {status === 'connecting' && transcript.length === 0 && (
                 <div className="mt-8 flex justify-center gap-1">
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 </div>
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

      {/* Controls */}
      <ControlBar 
        isMuted={isMuted} 
        onToggleMute={toggleMute} 
        onEndCall={() => setIsEnding(true)} 
        isActive={status === 'connected' && !isEnding}
        volumeLevel={volume}
      />
    </div>
  );
};