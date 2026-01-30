'use client';

import { useEffect, useRef, useState } from 'react';

// Get your SITE KEY at: https://dash.cloudflare.com/sign-up?to=/:account/turnstile
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback'?: () => void;
        'expired-callback'?: () => void;
        theme?: string;
        size?: string;
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = '',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Don't render if no site key configured
    if (!TURNSTILE_SITE_KEY) {
      console.warn('Turnstile site key not configured');
      // Auto-pass verification in development
      onVerify('dev-mode-no-turnstile');
      return;
    }

    // Load Turnstile script if not already loaded
    if (!document.getElementById('turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else if (window.turnstile) {
      setIsLoaded(true);
    }
  }, [onVerify]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile || !TURNSTILE_SITE_KEY) return;

    // Render the widget
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: onVerify,
      'error-callback': onError,
      'expired-callback': onExpire,
      theme,
      size,
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [isLoaded, onVerify, onError, onExpire, theme, size]);

  // Don't render anything if not configured (development mode)
  if (!TURNSTILE_SITE_KEY) {
    return null;
  }

  return <div ref={containerRef} className={className} />;
}

// Hook for invisible Turnstile
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = (t: string) => {
    setToken(t);
    setIsVerified(true);
  };

  const reset = () => {
    setToken(null);
    setIsVerified(false);
  };

  return {
    token,
    isVerified,
    handleVerify,
    reset,
    TurnstileWidget: (props: Omit<TurnstileProps, 'onVerify'>) => (
      <Turnstile {...props} onVerify={handleVerify} />
    ),
  };
}
