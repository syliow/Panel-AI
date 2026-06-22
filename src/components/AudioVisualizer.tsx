'use client';

import React, { useEffect, useRef } from 'react';
import { SubscribeToVolume } from '@/types';

interface AudioVisualizerProps {
  subscribeToVolume: SubscribeToVolume;
  isMuted: boolean;
}

/**
 * A highly optimized component that visualizes audio volume using direct DOM manipulation
 * to avoid triggering React re-renders at 60fps.
 */
export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ subscribeToVolume, isMuted }) => {
  const visualizerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMuted) {
      if (visualizerRef.current) {
        visualizerRef.current.style.transform = 'scale(1)';
      }
      return;
    }

    return subscribeToVolume((vol) => {
       if (visualizerRef.current) {
         visualizerRef.current.style.transform = `scale(${1 + (vol * 0.4)})`;
       }
    });
  }, [subscribeToVolume, isMuted]);

  return (
    <div
        ref={visualizerRef}
        className="absolute inset-0 rounded-full border border-slate-900 dark:border-white opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ transform: 'scale(1)' }}
    />
  );
};
