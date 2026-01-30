// Cloudflare Turnstile verification utility
// Get your keys at: https://dash.cloudflare.com/sign-up?to=/:account/turnstile

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Verify a Turnstile token server-side
 * @param token - The token from the client-side widget
 * @param ip - Optional client IP address for additional verification
 */
export async function verifyTurnstileToken(
  token: string | null,
  ip?: string
): Promise<TurnstileVerifyResult> {
  // If Turnstile is not configured, allow the request (for development)
  if (!TURNSTILE_SECRET_KEY) {
    console.warn('Turnstile not configured - allowing request');
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'Security verification required' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const result = await response.json();

    if (result.success) {
      return { success: true };
    } else {
      console.warn('Turnstile verification failed:', result['error-codes']);
      return { 
        success: false, 
        error: 'Security verification failed. Please refresh and try again.' 
      };
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    // Fail open on network errors to not block legitimate users
    return { success: true };
  }
}
