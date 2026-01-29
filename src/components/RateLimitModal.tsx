'use client';

import React from 'react';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType?: 'rpm' | 'tpm' | 'rpd' | 'general';
}

export const RateLimitModal: React.FC<RateLimitModalProps> = ({ 
  isOpen, 
  onClose,
  limitType = 'general'
}) => {
  if (!isOpen) return null;

  const getContent = () => {
    switch (limitType) {
      case 'rpm':
        return {
          title: 'Please Slow Down',
          description: 'You\'ve made too many requests in a short time.',
          details: 'To ensure the best experience for all users, we have usage limits in place.',
          waitTime: 'Please wait 1 minute before trying again.',
          icon: '⏱️'
        };
      case 'tpm':
        return {
          title: 'Please Slow Down',
          description: 'You\'ve made too many requests in a short time.',
          details: 'To ensure the best experience for all users, we have usage limits in place.',
          waitTime: 'Please wait 1 minute before trying again.',
          icon: '⏱️'
        };
      case 'rpd':
        return {
          title: 'Daily Limit Reached',
          description: 'You\'ve reached your usage limit for today.',
          details: 'To ensure fair access for everyone, we limit daily usage.',
          waitTime: 'Please try again tomorrow.',
          icon: '📅'
        };
      default:
        return {
          title: 'Please Slow Down',
          description: 'You\'ve made too many requests.',
          details: 'To ensure the best experience for all users, we have usage limits in place.',
          waitTime: 'Please wait a moment and try again.',
          icon: '⚠️'
        };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-3xl">
            {content.icon}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white">
          {content.title}
        </h2>

        {/* Description */}
        <p className="text-center text-slate-700 dark:text-slate-300 font-medium">
          {content.description}
        </p>

        {/* Details */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {content.details}
          </p>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
            ⏳ {content.waitTime}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
