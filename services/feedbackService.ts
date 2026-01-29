import { GoogleGenAI, Type } from '@google/genai';
import { FeedbackData, InterviewConfig, TranscriptItem } from '../types';
import { checkRateLimit, isQuotaError, RateLimitError } from '../utils/apiUtils';

export async function generateInterviewFeedback(
  transcript: TranscriptItem[],
  config: InterviewConfig
): Promise<FeedbackData> {
  // Rate Limit: 1 request per 10 seconds
  if (!checkRateLimit('generate_feedback', 10000)) {
     throw new RateLimitError("Please wait before regenerating feedback.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Format transcript for the prompt
  const transcriptText = transcript
    .map(item => `${item.speaker}: ${item.text}`)
    .join('\n');

  const difficultyContext = config.difficulty ? `Difficulty Level: ${config.difficulty}` : '';

  const prompt = `
    You are an expert interview coach. Analyze the following interview transcript and provide constructive feedback with quantitative scoring.
    
    **Interview Details:**
    - Role: ${config.jobTitle}
    - Type: ${config.interviewType}
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

  try {
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
                    required: ["category", "score", "reason"]
                }
            },
            speechAnalysis: {
                type: Type.OBJECT,
                properties: {
                    wpm: { type: Type.NUMBER, description: "Estimated Words Per Minute" },
                    fillerWordCount: { type: Type.NUMBER, description: "Estimated count of 'um', 'uh', 'like'" },
                    clarityScore: { type: Type.NUMBER, description: "1-10 score for speech clarity" },
                    feedback: { type: Type.STRING, description: "Feedback on pacing and tone" }
                },
                required: ["wpm", "fillerWordCount", "clarityScore", "feedback"]
            },
            questionAnalysis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        userAnswer: { type: Type.STRING },
                        feedback: { type: Type.STRING },
                        idealAnswer: { type: Type.STRING, description: "An example of a 10/10 perfect answer to this question" }
                    },
                    required: ["question", "userAnswer", "feedback", "idealAnswer"]
                }
            }
          },
          required: ["strengths", "improvements", "summary", "overallScore", "metrics", "speechAnalysis", "questionAnalysis"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty response from AI");
    }

    return JSON.parse(jsonText) as FeedbackData;
  } catch (error) {
    if (isQuotaError(error)) {
        throw new Error("QUOTA_EXCEEDED");
    }
    // Log message only to avoid leaking sensitive data
    console.error("Error generating feedback:", error instanceof Error ? error.message : String(error));
    return {
      strengths: ["Error analyzing session."],
      improvements: [],
      summary: "Could not generate report due to a technical error.",
      overallScore: 0,
      metrics: [],
      speechAnalysis: { wpm: 0, fillerWordCount: 0, clarityScore: 0, feedback: "N/A" },
      questionAnalysis: []
    };
  }
}