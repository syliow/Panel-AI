import { GoogleGenAI, Type } from '@google/genai';
import { checkRateLimit, isQuotaError, RateLimitError } from '../utils/apiUtils';

export async function validateJobTitle(jobTitle: string): Promise<{ isValid: boolean; message?: string }> {
  // Rate Limit: 1 request per 2 seconds
  if (!checkRateLimit('validate_title', 2000)) {
    // If rate limited, just let it pass client-side to avoid blocking the UI too aggressively,
    // or return a specific error if strictness is preferred. 
    // For UX, we'll assume it's valid if they are typing too fast.
    return { isValid: true };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  
  const ai = new GoogleGenAI({ apiKey });

  // Using cost-efficient model
  const model = 'gemini-flash-lite-latest'; 

  const prompt = `
    You are a validation engine for a professional job interview simulator.
    Determine if the user input "${jobTitle}" represents a specific, legitimate professional role or job title suitable for a serious job interview context.

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

  try {
      const response = await ai.models.generateContent({
          model,
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
      if (!text) return { isValid: true }; // Fallback

      const result = JSON.parse(text);
      return result;
  } catch (e) {
      if (isQuotaError(e)) {
          throw new Error("QUOTA_EXCEEDED");
      }
      console.error("Validation error");
      // Fallback to allowing it if API fails non-critically
      return { isValid: true }; 
  }
}