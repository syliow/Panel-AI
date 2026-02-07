import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/utils/turnstile';


// Rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 feedback requests per minute

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

// Maximum allowed sizes
const MAX_TRANSCRIPT_LENGTH = 100; // Max 100 transcript items
const MAX_TEXT_LENGTH = 10000; // Max 10K chars per text field
const MAX_JOB_TITLE_LENGTH = 100;

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
    const body = await request.json();
    const { transcript, config, turnstileToken } = body;

    // Verify Turnstile
    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIP);
    if (!turnstileResult.success) {
      return NextResponse.json({ error: turnstileResult.error || 'Security verification failed' }, { status: 403 });
    }

    // Input validation
    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json({ error: 'Invalid transcript format' }, { status: 400 });
    }
    
    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Invalid config format' }, { status: 400 });
    }

    // Size limits
    if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
      return NextResponse.json({ error: 'Transcript too long' }, { status: 400 });
    }

    if (config.jobTitle && config.jobTitle.length > MAX_JOB_TITLE_LENGTH) {
      return NextResponse.json({ error: 'Job title too long' }, { status: 400 });
    }

    // Sanitize and validate transcript items
    const sanitizedTranscript = transcript.slice(0, MAX_TRANSCRIPT_LENGTH).map((item: unknown) => {
      if (typeof item !== 'object' || item === null) {
        return { speaker: 'Unknown', text: '' };
      }
      const typedItem = item as { speaker?: unknown; text?: unknown };
      return {
        speaker: typeof typedItem.speaker === 'string' ? typedItem.speaker.slice(0, 20) : 'Unknown',
        text: typeof typedItem.text === 'string' ? typedItem.text.slice(0, MAX_TEXT_LENGTH) : ''
      };
    });

    const ai = new GoogleGenAI({ apiKey });

    // Format transcript for the prompt
    const transcriptText = sanitizedTranscript
      .map((item: { speaker: string; text: string }) => `${item.speaker}: ${item.text}`)
      .join('\n');

    const safeJobTitle = String(config.jobTitle || 'Unknown Role').slice(0, MAX_JOB_TITLE_LENGTH);
    const safeInterviewType = ['Behavioral', 'Technical', 'General'].includes(config.interviewType) 
      ? config.interviewType 
      : 'General';
    const difficultyContext = config.difficulty ? `Difficulty Level: ${config.difficulty}` : '';

    const prompt = `
      You are an expert interview coach. Analyze the following interview transcript and provide constructive feedback with quantitative scoring.
      
      **Interview Details:**
      - Role: ${safeJobTitle}
      - Type: ${safeInterviewType}
      - ${difficultyContext}

      **Transcript:**
      ${transcriptText}

      **Task:**
      Return a VALID JSON object (and nothing else) with this exact structure:
      {
        "strengths": ["List of strings"],
        "improvements": ["List of strings"],
        "summary": "Full text summary",
        "overallScore": number (0-100),
        "metrics": [
           { "category": "String", "score": number (1-10), "reason": "reason" }
        ],
        "speechAnalysis": {
           "wpm": number,
           "fillerWordCount": number,
           "clarityScore": number (1-10),
           "feedback": "string"
        },
        "questionAnalysis": [
           {
             "question": "string",
             "userAnswer": "string",
             "feedback": "string",
             "idealAnswer": "string (perfect answer example)"
           }
        ]
      }
      Return ONLY raw JSON. No markdown backticks or conversational text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemma-3-4b-it',
      contents: prompt,
    });

    let jsonText = response.text || '';
    
    // Clean and extract braces
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    const startIdx = jsonText.indexOf('{');
    const endIdx = jsonText.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      jsonText = jsonText.substring(startIdx, endIdx + 1);
    }

    if (!jsonText) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
    }

    try {
      return NextResponse.json(JSON.parse(jsonText));
    } catch (e) {
      console.error('Feedback JSON Parse Error:', jsonText);
      return NextResponse.json({ 
        error: 'Failed to parse feedback',
        summary: 'Feedback was generated but the format was invalid. Please try again.',
        overallScore: 50,
        strengths: [],
        improvements: [],
        metrics: [],
        speechAnalysis: { wpm: 0, fillerWordCount: 0, clarityScore: 5, feedback: 'Error processing speech metrics' },
        questionAnalysis: []
      });
    }
  } catch (error: unknown) {
    console.error('Feedback generation error:', error instanceof Error ? error.message : 'Unknown error');
    
    // Check for quota error
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('resource exhausted')) {
      return NextResponse.json({ error: 'QUOTA_EXCEEDED' }, { status: 429 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate feedback',
      strengths: ['Error analyzing session.'],
      improvements: [],
      summary: 'Could not generate report due to a technical error.',
      overallScore: 0,
      metrics: [],
      speechAnalysis: { wpm: 0, fillerWordCount: 0, clarityScore: 0, feedback: 'N/A' },
      questionAnalysis: []
    }, { status: 500 });
  }
}
