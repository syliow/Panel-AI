/**
 * @jest-environment jsdom
 */

import { GeminiLiveService } from './geminiLive';

// Mock dependencies
const mockGainNode = {
  gain: { value: 1 },
  connect: jest.fn(),
  disconnect: jest.fn(),
};

const mockAudioContextInstance = {
  createGain: jest.fn(() => mockGainNode),
  createMediaStreamSource: jest.fn(() => ({ connect: jest.fn(), disconnect: jest.fn() })),
  createScriptProcessor: jest.fn(() => ({ connect: jest.fn(), disconnect: jest.fn(), port: { postMessage: jest.fn() } })),
  destination: {},
  state: 'running',
  resume: jest.fn(),
  suspend: jest.fn(),
  close: jest.fn(),
};

const mockAudioContext = jest.fn(() => mockAudioContextInstance);

// Mock GoogleGenAI
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    live: {
      connect: jest.fn().mockResolvedValue({
        sendRealtimeInput: jest.fn(),
        sendToolResponse: jest.fn(),
        close: jest.fn(),
      }),
    },
  })),
  Modality: { AUDIO: 'AUDIO' },
  Type: { OBJECT: 'OBJECT', STRING: 'STRING' },
}));

describe('GeminiLiveService Audio Configuration', () => {
  let originalAudioContext: any;
  let originalFetch: any;
  let originalUserAgent: any;

  beforeAll(() => {
    originalAudioContext = window.AudioContext;
    originalFetch = global.fetch;
    originalUserAgent = window.navigator.userAgent;

    // Setup mocks
    (window as any).AudioContext = mockAudioContext;
    (window as any).webkitAudioContext = mockAudioContext;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ apiKey: 'test-api-key' }),
      })
    ) as jest.Mock;
  });

  afterAll(() => {
    window.AudioContext = originalAudioContext;
    global.fetch = originalFetch;

    Object.defineProperty(window.navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGainNode.gain.value = 1; // Reset gain default
  });

  it('should initialize AudioContext WITHOUT explicit sampleRate for output and set gain to 1.0 on mobile', async () => {
    // Simulate Mobile User Agent
    Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        configurable: true
    });

    const service = new GeminiLiveService();
    await service.connect({ jobTitle: 'Developer', interviewType: 'Technical' } as any, 'mock-token', {
        onOpen: jest.fn(),
        onClose: jest.fn(),
        onError: jest.fn(),
        onAudioData: jest.fn(),
        onTranscript: jest.fn(),
        onEndSessionTriggered: jest.fn(),
        onAiSpeaking: jest.fn(),
    });

    // Check AudioContext constructor arguments
    expect(mockAudioContext).toHaveBeenCalledTimes(2);

    // First call is input (with 16000), second is output (should be undefined)
    const outputContextCallArgs = mockAudioContext.mock.calls[1];
    expect(outputContextCallArgs[0]).toBeUndefined();

    // Check Gain Value
    expect(mockGainNode.gain.value).toBe(1.0);
  });

  it('should initialize AudioContext WITHOUT explicit sampleRate for output and set gain to 1.0 on desktop', async () => {
    // Simulate Desktop User Agent
    Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        configurable: true
    });

    const service = new GeminiLiveService();
    await service.connect({ jobTitle: 'Developer', interviewType: 'Technical' } as any, 'mock-token', {
        onOpen: jest.fn(),
        onClose: jest.fn(),
        onError: jest.fn(),
        onAudioData: jest.fn(),
        onTranscript: jest.fn(),
        onEndSessionTriggered: jest.fn(),
        onAiSpeaking: jest.fn(),
    });

    // Check AudioContext constructor arguments
    const outputContextCallArgs = mockAudioContext.mock.calls[1];
    expect(outputContextCallArgs[0]).toBeUndefined();

    // Check Gain Value
    expect(mockGainNode.gain.value).toBe(1.0);
  });
});
