'use client';

import React from 'react';
import { TranscriptItem } from '@/types';
import { TranscriptMessage } from './TranscriptMessage';

interface TranscriptListProps {
  transcript: TranscriptItem[];
  isAiSpeaking: boolean;
}

export const TranscriptList = React.memo<TranscriptListProps>(({ transcript, isAiSpeaking }) => {
  return (
    <ul className="flex flex-col w-full" aria-live="polite" role="log">
      {transcript.map((item, index) => (
        <TranscriptMessage
            key={item.id}
            item={item}
            isSpeaking={isAiSpeaking && item.speaker === 'AI' && index === transcript.length - 1}
        />
      ))}
    </ul>
  );
});

TranscriptList.displayName = 'TranscriptList';
