import { GoogleGenAI } from '@google/genai';
import { checkRateLimit, isQuotaError, RateLimitError } from '../utils/apiUtils';

/**
 * Parses a resume file (PDF, Image, or Text) using Gemini to extract relevant context.
 */
export async function parseResume(file: File): Promise<string> {
  // Rate Limit: 1 request per 5 seconds
  if (!checkRateLimit('parse_resume', 5000)) {
    throw new RateLimitError("Please wait a moment before uploading again.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Convert file to base64
  const base64Data = await fileToBase64(file);
  
  const prompt = "Analyze this resume and extract the candidate's key skills, work history summary, and recent projects. Format it as a concise text summary suitable for an interviewer to read before an interview.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: prompt }
        ]
      }
    });
    
    return response.text || "Could not extract resume context.";
  } catch (e) {
    if (isQuotaError(e)) {
        throw new Error("QUOTA_EXCEEDED");
    }
    console.error("Resume parsing error");
    throw new Error("Failed to parse resume. Please ensure the file is a valid PDF, Image, or Text file.");
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data URI prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}