import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 validation requests per minute

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

const MAX_JOB_TITLE_LENGTH = 100;

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  // Rate limiting
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json({ isValid: true }); // Fail open on rate limit
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { jobTitle } = body;

    if (!jobTitle || typeof jobTitle !== 'string') {
      return NextResponse.json({ error: 'Invalid job title' }, { status: 400 });
    }

    // Sanitize input
    const sanitizedTitle = jobTitle.trim().slice(0, MAX_JOB_TITLE_LENGTH);
    
    if (sanitizedTitle.length < 2) {
      return NextResponse.json({ isValid: false, message: 'Job title is too short.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a validation engine for a professional job interview simulator.
      Determine if the user input "${sanitizedTitle}" represents a specific, legitimate professional role or job title suitable for a serious job interview context.

      Criteria for INVALID inputs:
      - Random keystrokes (e.g., "asdf", "k")
      - Animals or objects without a job context (e.g., "cat", "banana", "table")
      - Gibberish or non-words
      - Extremely offensive or inappropriate terms
      - Vague statements that aren't titles (e.g., "I want a job", "help me")

      Criteria for VALID inputs:
      - Standard job titles (e.g., "Software Engineer", "Marketing Manager", "Plumber")
      - Student/Intern roles (e.g., "Student", "Intern")
      - Creative but recognizable roles (e.g., "Dog Walker", "Content Creator")

      Return a JSON object with:
      - isValid: boolean
      - message: string (A very short, polite error message if invalid, e.g., "'Cat' is not a valid job title.")
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            message: { type: Type.STRING }
          },
          required: ['isValid']
        }
      }
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ isValid: true }); // Fallback
    }

    return NextResponse.json(JSON.parse(text));
  } catch (error: unknown) {
    console.error('Validation error:', error instanceof Error ? error.message : 'Unknown error');
    
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('resource exhausted')) {
      return NextResponse.json({ error: 'QUOTA_EXCEEDED' }, { status: 429 });
    }
    
    // Fallback to allowing it if API fails
    return NextResponse.json({ isValid: true });
  }
}
