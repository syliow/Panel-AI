import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 suggestion requests per minute

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
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

const MAX_INPUT_LENGTH = 50;

// Simple LRU Cache
const suggestionCache = new Map<string, string[]>();
const CACHE_SIZE_LIMIT = 100;

function getFromCache(key: string): string[] | null {
  if (suggestionCache.has(key)) {
    // LRU refresh: move to end
    const value = suggestionCache.get(key)!;
    suggestionCache.delete(key);
    suggestionCache.set(key, value);
    return value;
  }
  return null;
}

function addToCache(key: string, value: string[]) {
  if (suggestionCache.size >= CACHE_SIZE_LIMIT) {
    const firstKey = suggestionCache.keys().next().value;
    if (firstKey) suggestionCache.delete(firstKey);
  }
  suggestionCache.set(key, value);
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  // Rate limiting - fail silently for suggestions
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json({ suggestions: [] });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== 'string' || input.length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    // Sanitize input - limit length and remove potentially harmful characters
    const sanitizedInput = input
      .trim()
      .slice(0, MAX_INPUT_LENGTH)
      .replace(/[<>{}]/g, ''); // Remove potential injection characters

    if (sanitizedInput.length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    // Check cache
    const cached = getFromCache(sanitizedInput);
    if (cached) {
      return NextResponse.json({ suggestions: cached });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemma-3-4b-it',
      contents: `Provide exactly 5 highly professional and common job titles that start with or are closely related to: "${sanitizedInput}". Return as a raw JSON array of strings only. Example: ["Title 1", "Title 2"]. Do not include markdown or conversational text.`,
    });

    let text = response.text || '[]';
    // Clean markdown and extract bracketed array
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const startIdx = text.indexOf('[');
    const endIdx = text.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1) {
      text = text.substring(startIdx, endIdx + 1);
    }

    let result = [];
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error in suggestions:', text);
      result = [];
    }
    // Filter out exact match and limit to 5
    const filtered = result
      .filter((s: string) => s.toLowerCase() !== sanitizedInput.toLowerCase())
      .slice(0, 5);
    
    // Update cache
    addToCache(sanitizedInput, filtered);

    return NextResponse.json({ suggestions: filtered });
  } catch (error: unknown) {
    console.error('Suggestions error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ suggestions: [] });
  }
}
