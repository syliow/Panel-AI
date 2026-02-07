'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiLiveService, GeminiLiveCallbacks } from '@/services/geminiLive';
import { InterviewConfig, TranscriptItem, ConnectionStatus } from '@/types';
import { MAX_INTERVIEW_DURATION, INACTIVITY_TIMEOUT_MS } from '@/constants';

export function useInterviewSession(config: InterviewConfig, onSessionEnd: (transcript: TranscriptItem[]) => void) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected'); // Start disconnected, wait for user action
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasStarted, setHasStarted] = useState(false); // Track if user has started
  
  const [isEnding, setIsEnding] = useState(false);
  const [endReason, setEndReason] = useState<'manual' | 'timeout' | 'inactivity'>('manual');
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitType, setRateLimitType] = useState<'rpm' | 'tpm' | 'rpd' | 'general'>('general');

  const serviceRef = useRef<GeminiLiveService | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);
  const volumeRef = useRef<number>(0);
  const volumeRafRef = useRef<number | null>(null);

  const disconnect = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.disconnect();
    }
  }, []);

  const handleEndCall = useCallback(async () => {
    await disconnect();
    onSessionEnd(transcript);
  }, [disconnect, onSessionEnd, transcript]);

  // Start the interview - called by user action
  const startInterview = useCallback((turnstileToken: string) => {
    if (hasStarted) return;
    
    setHasStarted(true);
    setStatus('connecting');
    
    const service = new GeminiLiveService();
    serviceRef.current = service;
    lastActivityRef.current = Date.now();

    const callbacks: GeminiLiveCallbacks = {
      onOpen: () => {
        setStatus('connected');
        setError(null);
        // Timer does NOT start here anymore (waits for first interaction)
      },
      onClose: () => {
        setStatus('disconnected');
        if (timerRef.current) clearInterval(timerRef.current);
      },
      onError: (err: unknown) => {
        console.error('Session Error:', err);
        
        const errorMessage = typeof err === 'string' ? err : '';
        
        // Check for quota exceeded (API key limit)
        if (err === 'QUOTA_EXCEEDED' || errorMessage.includes('quota') || errorMessage.includes('resource exhausted')) {
            setShowQuotaModal(true);
        }
        // Check for rate limit errors
        else if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many requests')) {
            // Determine the type of rate limit
            if (errorMessage.toLowerCase().includes('per minute') || errorMessage.toLowerCase().includes('rpm')) {
                setRateLimitType('rpm');
            } else if (errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('tpm')) {
                setRateLimitType('tpm');
            } else if (errorMessage.toLowerCase().includes('day') || errorMessage.toLowerCase().includes('daily') || errorMessage.toLowerCase().includes('rpd')) {
                setRateLimitType('rpd');
            } else {
                setRateLimitType('general');
            }
            setShowRateLimitModal(true);
        }
        // Other errors
        else {
            setError(errorMessage || 'Connection failed');
        }
        
        setStatus('error');
        if (timerRef.current) clearInterval(timerRef.current);
      },
      onAudioData: (vol: number) => {
          const nextVolume = Math.min(1, vol / 50);
          volumeRef.current = nextVolume;

          if (!volumeRafRef.current) {
              volumeRafRef.current = requestAnimationFrame(() => {
                  setVolume(volumeRef.current);
                  volumeRafRef.current = null;
              });
          }
      },
      onAiSpeaking: (speaking: boolean) => {
        setIsAiSpeaking(speaking);
        if (speaking) lastActivityRef.current = Date.now();
      },
      onTranscript: (text: string, speaker: 'AI' | 'Candidate', isFinal: boolean, turnId: string) => {
        lastActivityRef.current = Date.now();
        
        // Start timer on FIRST transcript if not running
        if (!timerRef.current) {
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
        }
        
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

    service.connect(config, callbacks, turnstileToken).catch(err => {
        setStatus('error');
        setError(err.message);
    });
  }, [config, hasStarted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
      if (volumeRafRef.current) {
          cancelAnimationFrame(volumeRafRef.current);
          volumeRafRef.current = null;
      }
    };
  }, [disconnect]);

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
    stopTimer: () => { if(timerRef.current) clearInterval(timerRef.current); }
  };
}
