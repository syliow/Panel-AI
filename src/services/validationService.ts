import { checkRateLimit } from '@/utils/apiUtils';

export async function validateJobTitle(jobTitle: string): Promise<{ isValid: boolean; message?: string }> {
  // Rate Limit: 1 request per 2 seconds
  if (!checkRateLimit('validate_title', 2000)) {
    // If rate limited, just let it pass client-side to avoid blocking the UI too aggressively
    return { isValid: true };
  }

  try {
    const response = await fetch('/api/validate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobTitle }),
    });

    if (!response.ok) {
      const data = await response.json();
      if (data.error === 'QUOTA_EXCEEDED' || response.status === 429) {
        throw new Error('QUOTA_EXCEEDED');
      }
      return { isValid: true }; // Fallback
    }

    return response.json();
  } catch (e) {
    console.error('Validation error:', e);
    return { isValid: true }; // Fallback
  }
}
