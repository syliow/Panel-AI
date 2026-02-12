import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock Turnstile
jest.mock('@/utils/turnstile', () => ({
  verifyTurnstileToken: jest.fn().mockImplementation((token: string) => {
    if (token === 'valid-token') {
      return { success: true };
    } else {
      return { success: false, error: 'Invalid token' };
    }
  }),
}));

describe('POST /api/live-session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  // Helper to create a request
  function createRequest(body: any, ip: string = '127.0.0.1') {
    return {
      json: async () => body,
      headers: {
        get: (name: string) => {
          if (name === 'x-forwarded-for') return ip;
          return null;
        }
      }
    } as unknown as NextRequest;
  }

  it('should return API key for valid token', async () => {
    const req = createRequest({ token: 'valid-token' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.apiKey).toBe('test-key');
  });

  it('should return error for invalid token', async () => {
    const req = createRequest({ token: 'invalid-token' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Invalid token');
  });

  it('should handle missing API key', async () => {
    delete process.env.GEMINI_API_KEY;
    const req = createRequest({ token: 'valid-token' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('API key not configured');
  });

  it('should enforce rate limits', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const ip = '1.2.3.4';

    // Simulate 10 successful requests
    for (let i = 0; i < 10; i++) {
      const req = createRequest({ token: 'valid-token' }, ip);
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    // 11th request should fail
    const req = createRequest({ token: 'valid-token' }, ip);
    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
