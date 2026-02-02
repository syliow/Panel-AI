import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 resume uploads per minute

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

// Security constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/jpg'];

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  // Rate limiting
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload PDF, TXT, or image.' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Additional validation: check file extension matches type
    const fileName = file.name.toLowerCase();
    const validExtensions: Record<string, string[]> = {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/jpg': ['.jpg', '.jpeg'],
    };
    
    const allowedExts = validExtensions[file.type] || [];
    const hasValidExt = allowedExts.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExt) {
      return NextResponse.json({ error: 'File extension does not match file type.' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');

    const ai = new GoogleGenAI({ apiKey });

    const prompt = "Analyze this resume and extract the candidate's key skills, work history summary, and recent projects. Format it as a concise text summary suitable for an interviewer to read before an interview. Do not include any personal information like phone numbers, email addresses, or physical addresses.";

    const response = await ai.models.generateContent({
      model: 'gemma-3-4b-it',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: prompt }
        ]
      }
    });

    return NextResponse.json({ 
      context: response.text || 'Could not extract resume context.' 
    });
  } catch (error: unknown) {
    console.error('Resume parsing error:', error instanceof Error ? error.message : 'Unknown error');
    
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('resource exhausted')) {
      return NextResponse.json({ error: 'QUOTA_EXCEEDED' }, { status: 429 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to parse resume. Please ensure the file is a valid PDF, Image, or Text file.' 
    }, { status: 500 });
  }
}
