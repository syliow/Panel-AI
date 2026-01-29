'use client';

import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-8 w-8" }) => {
  return (
    <svg 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <rect x="8" y="8" width="8" height="24" fill="currentColor" />
      <rect x="20" y="8" width="4" height="24" fill="currentColor" opacity="0.6" />
      <rect x="28" y="8" width="4" height="24" fill="currentColor" opacity="0.3" />
    </svg>
  );
};
