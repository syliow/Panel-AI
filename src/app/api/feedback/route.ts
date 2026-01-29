import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

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
    const { transcript, config } = body;

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
      1. Overall Score (0-100).
      2. Metrics (1-10) for 3-4 categories.
      3. Strengths & Improvements.
      4. **Speech Analysis**: Estimate filler word usage (um, uh, like) and clarity.
      5. **Ideal Answers**: Identify the 2 most important questions asked by the AI. For each, show the user's answer and write a "Better/Ideal Answer" that would score 10/10.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            overallScore: { type: Type.NUMBER },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ['category', 'score', 'reason']
              }
            },
            speechAnalysis: {
              type: Type.OBJECT,
              properties: {
                wpm: { type: Type.NUMBER, description: 'Estimated Words Per Minute' },
                fillerWordCount: { type: Type.NUMBER, description: "Estimated count of 'um', 'uh', 'like'" },
                clarityScore: { type: Type.NUMBER, description: '1-10 score for speech clarity' },
                feedback: { type: Type.STRING, description: 'Feedback on pacing and tone' }
              },
              required: ['wpm', 'fillerWordCount', 'clarityScore', 'feedback']
            },
            questionAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  userAnswer: { type: Type.STRING },
                  feedback: { type: Type.STRING },
                  idealAnswer: { type: Type.STRING, description: 'An example of a 10/10 perfect answer to this question' }
                },
                required: ['question', 'userAnswer', 'feedback', 'idealAnswer']
              }
            }
          },
          required: ['strengths', 'improvements', 'summary', 'overallScore', 'metrics', 'speechAnalysis', 'questionAnalysis']
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(jsonText));
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
