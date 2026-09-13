'use client';

import React, { useEffect, useRef } from 'react';

interface ControlBarVolumeVisualizerProps {
  subscribeToVolume: (callback: (volume: number) => void) => () => void;
  isActive: boolean;
  isMuted: boolean;
}

export const ControlBarVolumeVisualizer: React.FC<ControlBarVolumeVisualizerProps> = ({
  subscribeToVolume,
  isActive,
  isMuted
}) => {
  const visualizerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || isMuted) return;

    const unsubscribe = subscribeToVolume((vol) => {
      if (visualizerRef.current) {
        visualizerRef.current.style.transform = `scale(${1 + (vol * 0.4)})`;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeToVolume, isActive, isMuted]);

  if (isMuted || !isActive) return null;

  return (
    <div
        ref={visualizerRef}
        className="absolute inset-0 rounded-full border border-slate-900 dark:border-white opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ transform: 'scale(1)' }}
    />
  );
};
