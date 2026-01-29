import { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiLiveService, GeminiLiveCallbacks } from '../services/geminiLive';
import { InterviewConfig, TranscriptItem, ConnectionStatus } from '../types';
import { MAX_INTERVIEW_DURATION, INACTIVITY_TIMEOUT_MS } from '../constants';

export function useInterviewSession(config: InterviewConfig, onSessionEnd: (transcript: TranscriptItem[]) => void) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [duration, setDuration] = useState(0);
  
  // End session states
  const [isEnding, setIsEnding] = useState(false);
  const [endReason, setEndReason] = useState<'manual' | 'timeout' | 'inactivity'>('manual');
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  const serviceRef = useRef<GeminiLiveService | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  // Helper to safely disconnect
  const disconnect = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.disconnect();
    }
  }, []);

  // Trigger ending flow
  const handleEndCall = useCallback(async () => {
    await disconnect();
    onSessionEnd(transcript);
  }, [disconnect, onSessionEnd, transcript]);

  // Main connection effect
  useEffect(() => {
    const service = new GeminiLiveService();
    serviceRef.current = service;
    lastActivityRef.current = Date.now();

    const callbacks: GeminiLiveCallbacks = {
      onOpen: () => {
        setStatus('connected');
        setError(null);
        
        // Start the session timer and inactivity checker
        timerRef.current = window.setInterval(() => {
          setDuration(prev => {
            const next = prev + 1;
            if (next >= MAX_INTERVIEW_DURATION) {
              setEndReason('timeout');
              setIsEnding(true);
            }
            return next;
          });
          
          if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
            setEndReason('inactivity');
            setIsEnding(true);
          }
        }, 1000);
      },
      onClose: () => {
        setStatus('disconnected');
        if (timerRef.current) clearInterval(timerRef.current);
      },
      onError: (err: any) => {
        console.error('Session Error:', err);
        if (err === 'QUOTA_EXCEEDED') {
            setShowQuotaModal(true);
        } else {
            setError(typeof err === 'string' ? err : 'Connection failed');
        }
        setStatus('error');
        if (timerRef.current) clearInterval(timerRef.current);
      },
      onAudioData: (vol: number) => {
          setVolume(Math.min(1, vol / 50));
      },
      onAiSpeaking: (speaking: boolean) => {
        setIsAiSpeaking(speaking);
        if (speaking) lastActivityRef.current = Date.now();
      },
      onTranscript: (text: string, speaker: 'AI' | 'Candidate', isFinal: boolean, turnId: string) => {
        // Reset inactivity on any transcript update
        lastActivityRef.current = Date.now();
        
        setTranscript(prev => {
            const existingIdx = prev.findIndex(item => item.id === turnId);
            if (existingIdx > -1) {
                const updated = [...prev];
                updated[existingIdx] = { ...updated[existingIdx], text, isPartial: !isFinal };
                return updated;
            }
            return [
                ...prev, 
                { id: turnId, speaker, text, timestamp: Date.now(), isPartial: !isFinal }
            ];
        });
      },
      onEndSessionTriggered: () => {
        setEndReason('manual');
        setIsEnding(true);
      }
    };

    // Initiate connection
    service.connect(config, callbacks).catch(err => {
        setStatus('error');
        setError(err.message);
    });

    return () => {
      disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config, disconnect]); // Dependencies: config only changes on new session

  const toggleMute = () => {
    if (serviceRef.current) {
        const next = !isMuted;
        serviceRef.current.setMute(next);
        setIsMuted(next);
    }
  };

  return {
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
    stopTimer: () => { if(timerRef.current) clearInterval(timerRef.current); }
  };
}