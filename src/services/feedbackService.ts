import { FeedbackData, InterviewConfig, TranscriptItem } from '@/types';
import { checkRateLimit, RateLimitError } from '@/utils/apiUtils';

export async function generateInterviewFeedback(
  transcript: TranscriptItem[],
  config: InterviewConfig
): Promise<FeedbackData> {
  // Rate Limit: 1 request per 10 seconds
  if (!checkRateLimit('generate_feedback', 10000)) {
    throw new RateLimitError("Please wait before regenerating feedback.");
  }

  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, config }),
  });

  if (!response.ok) {
    const data = await response.json();
    
    // Check if it's a rate limit error from the server
    if (response.status === 429 && data.error?.includes('Too many requests')) {
      throw new RateLimitError('You\'re making requests too quickly. Please wait a minute and try again.');
    }
    
    // Check if it's an API quota error
    if (data.error === 'QUOTA_EXCEEDED') {
      throw new Error('QUOTA_EXCEEDED');
    }
    
    throw new Error(data.error || 'Failed to generate feedback');
  }

  return response.json();
}
