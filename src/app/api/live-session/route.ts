import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (resets on server restart)
// For production, use Redis or a proper rate limiting service
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP
const MAX_MAP_SIZE = 10000; // Prevent unbounded memory growth

// Cleanup expired entries every minute to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimit.entries()) {
      if (now > record.resetTime) {
        rateLimit.delete(ip);
      }
    }
  }, RATE_LIMIT_WINDOW_MS);

  // Prevent interval from blocking process exit in Node.js
  if (cleanupInterval && typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    (cleanupInterval as any).unref();
  }
}

export const dynamic = 'force-dynamic';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Cleanup if too large (prevent DoS)
  if (rateLimit.size >= MAX_MAP_SIZE) {
    const oldestIp = rateLimit.keys().next().value;
    if (oldestIp) {
      rateLimit.delete(oldestIp);
    }
  }

  const record = rateLimit.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
}

// This endpoint provides the API key for the Gemini Live connection
// Security measures implemented:
// 1. Rate limiting per IP
// 2. Turnstile verification (Bot protection)

// POST method (Requires Turnstile token)
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  // Rate limiting
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' }, 
      { status: 429 }
    );
  }

  // Turnstile Verification
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (secretKey) {
      let token: string | undefined;
      try {
          const body = await request.json();
          token = body.token;
      } catch (e) {
          return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }

      if (!token) {
          return NextResponse.json({ error: 'Missing Turnstile token' }, { status: 400 });
      }

      const formData = new FormData();
      formData.append('secret', secretKey);
      formData.append('response', token);
      formData.append('remoteip', clientIP);

      try {
          const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
              body: formData,
              method: 'POST',
          });

          const outcome = await result.json();
          if (!outcome.success) {
               console.error('Turnstile verification failed:', outcome);
               return NextResponse.json({ error: 'Turnstile verification failed' }, { status: 403 });
          }
      } catch (e) {
          console.error('Turnstile verification error:', e);
          return NextResponse.json({ error: 'Verification service unavailable' }, { status: 500 });
      }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  return NextResponse.json({ apiKey });
}
