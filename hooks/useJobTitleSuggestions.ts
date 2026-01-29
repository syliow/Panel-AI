import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

export function useJobTitleSuggestions(input: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: `Provide exactly 5 highly professional and common job titles that start with or are closely related to: "${input}". Return as a raw JSON array of strings only.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        });
        const result = JSON.parse(response.text || '[]');
        // Filter out exact match
        setSuggestions(result.filter((s: string) => s.toLowerCase() !== input.toLowerCase()));
      } catch (e) {
        console.error("Suggestion error", e);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [input]);

  return { suggestions, isLoading, clearSuggestions: () => setSuggestions([]) };
}