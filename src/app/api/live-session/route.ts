import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/utils/turnstile';

// Simple in-memory rate limiter (resets on server restart)
// For production, use Redis or a proper rate limiting service
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP

export const dynamic = 'force-dynamic';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
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
// 2. Cloudflare Turnstile bot protection
// 3. Origin validation (optional - commented out for development)

// POST with Turnstile verification (preferred)
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  // Rate limiting
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' }, 
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { turnstileToken } = body;

    // Verify Turnstile token (bot protection)
    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIP);
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: turnstileResult.error || 'Security verification failed' }, 
        { status: 403 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error('Live session error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
