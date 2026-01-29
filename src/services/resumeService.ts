import { checkRateLimit, RateLimitError } from '@/utils/apiUtils';

/**
 * Parses a resume file (PDF, Image, or Text) using server-side API.
 */
export async function parseResume(file: File): Promise<string> {
  // Rate Limit: 1 request per 5 seconds
  if (!checkRateLimit('parse_resume', 5000)) {
    throw new RateLimitError("Please wait a moment before uploading again.");
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/resume', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json();
    if (data.error === 'QUOTA_EXCEEDED' || response.status === 429) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw new Error(data.error || 'Failed to parse resume');
  }

  const data = await response.json();
  return data.context;
}
