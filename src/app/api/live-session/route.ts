import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/utils/turnstile';

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
// 2. Turnstile Verification

// POST method (Requires Turnstile)
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
  try {
    const body = await request.json();
    const { turnstileToken } = body;

    // Verify token
    const verification = await verifyTurnstileToken(turnstileToken, clientIP);

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error || 'Security verification failed' },
        { status: 401 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  return NextResponse.json({ apiKey });
}
