
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock GoogleGenAI
const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent
        }
      };
    })
  };
});

// Helper to create a request
function createRequest(body: any) {
  return {
    json: async () => body,
    headers: {
      get: () => '127.0.0.1'
    }
  } as unknown as NextRequest;
}

describe('POST /api/validate-title', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    // Note: LRUCache is static, so it persists between tests in the same file execution context unless we can reset it.
    // But since we only have one test or we restart the test runner, it's fine.
    // Ideally we would expose a clearCache method for testing.
  });

  it('should use cache for subsequent requests', async () => {
    // Setup mock response with delay
    mockGenerateContent.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms simulated latency
      return {
        text: JSON.stringify({ isValid: true, message: 'Valid' })
      };
    });

    const body = { jobTitle: 'Software Engineer' };

    // First request (Miss)
    const req1 = createRequest(body);
    const start1 = Date.now();
    await POST(req1);
    const end1 = Date.now();
    const duration1 = end1 - start1;

    // Second request (Hit)
    const req2 = createRequest(body);
    const start2 = Date.now();
    await POST(req2);
    const end2 = Date.now();
    const duration2 = end2 - start2;

    console.log(`Cache Test - Request 1 (Miss): ${duration1}ms`);
    console.log(`Cache Test - Request 2 (Hit): ${duration2}ms`);

    expect(duration1).toBeGreaterThanOrEqual(100);
    expect(duration2).toBeLessThan(50); // Should be very fast
    expect(mockGenerateContent).toHaveBeenCalledTimes(1); // Only called once
  });
});
