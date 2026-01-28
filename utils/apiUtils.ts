/**
 * Checks if a specific action is allowed based on a cooldown period.
 * Uses sessionStorage to track the last execution time.
 * 
 * @param actionKey Unique identifier for the action (e.g., 'validate_title')
 * @param cooldownMs Time in milliseconds to wait between requests
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(actionKey: string, cooldownMs: number): boolean {
    const lastAttemptKey = `panel_ai_limit_${actionKey}`;
    const lastAttempt = sessionStorage.getItem(lastAttemptKey);
    const now = Date.now();
  
    if (lastAttempt) {
      const timePassed = now - parseInt(lastAttempt, 10);
      if (timePassed < cooldownMs) {
        return false;
      }
    }
  
    sessionStorage.setItem(lastAttemptKey, now.toString());
    return true;
  }
  
  /**
   * Analyzes an error object to determine if it's related to API Quotas.
   */
  export function isQuotaError(error: any): boolean {
    if (!error) return false;
    
    const msg = (typeof error === 'string' ? error : error.message || '').toLowerCase();
    
    return (
      msg.includes('429') || 
      msg.includes('quota') || 
      msg.includes('resource exhausted') ||
      msg.includes('too many requests') ||
      msg.includes('limit exceeded')
    );
  }

  export class RateLimitError extends Error {
    constructor(message: string = "Please wait a moment before trying again.") {
        super(message);
        this.name = "RateLimitError";
    }
  }