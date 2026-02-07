import { FeedbackData, InterviewConfig, TranscriptItem } from '@/types';
import { checkRateLimit, RateLimitError } from '@/utils/apiUtils';

export async function generateInterviewFeedback(
  transcript: TranscriptItem[],
  config: InterviewConfig,
  turnstileToken?: string | null
): Promise<FeedbackData> {
  // Rate Limit: 1 request per 10 seconds
  if (!checkRateLimit('generate_feedback', 10000)) {
    throw new RateLimitError("Please wait before regenerating feedback.");
  }

  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, config, turnstileToken }),
  });

  if (!response.ok) {
    const data = await response.json();
    if (data.error === 'QUOTA_EXCEEDED' || response.status === 429) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw new Error(data.error || 'Failed to generate feedback');
  }

  return response.json();
}
