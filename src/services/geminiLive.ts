import { FunctionDeclaration, GoogleGenAI, LiveServerMessage, Modality, Session, Type } from '@google/genai';
import { MODEL_NAME, SYSTEM_PROMPT_TEMPLATE } from '@/constants';
import { InterviewConfig } from '@/types';
import { decodeAudioData, decodeBase64, encodeBase64 } from '@/utils/audioUtils';
import { isQuotaError } from '@/utils/apiUtils';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

export interface GeminiLiveCallbacks {
  onOpen: () => void;
  onClose: (event: CloseEvent) => void;
  onError: (event: unknown) => void;
  onAudioData: (visualizerData: number) => void;
  onTranscript: (text: string, speaker: 'AI' | 'Candidate', isFinal: boolean, turnId: string) => void;
  onEndSessionTriggered: () => void;
  onAiSpeaking: (isSpeaking: boolean) => void;
}

const END_INTERVIEW_TOOL: FunctionDeclaration = {
  name: 'endInterview',
  parameters: { 
    type: Type.OBJECT, 
    properties: {
      reason: {
        type: Type.STRING,
        description: "The reason for ending the interview (e.g., 'finished', 'user_request')."
      }
    },
    required: ['reason']
  },
  description: 'Call this function to end the interview session when the conversation is concluded.',
};

export class GeminiLiveService {
  private ai: GoogleGenAI | null = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private mediaStream: MediaStream | null = null;
  private outputNode: GainNode | null = null;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private session: Session | null = null;
  
  private nextStartTime: number = 0;
  private isMuted: boolean = false;
  private isDisconnecting: boolean = false;
  private pendingEndSession: boolean = false;

  // Transcript tracking
  private currentInputTranscription: string = '';
  private currentOutputTranscription: string = '';
  private currentInputTurnId: string = '';
  private currentOutputTurnId: string = '';

  constructor() {
    this.resetTurnIds();
  }

  private resetTurnIds() {
    this.currentInputTurnId = 'user-' + Math.random().toString(36).substring(7);
    this.currentOutputTurnId = 'ai-' + Math.random().toString(36).substring(7);
  }

  public async connect(config: InterviewConfig, callbacks: GeminiLiveCallbacks, turnstileToken?: string) {
    // Fetch API key from server
    let apiKey: string;
    try {
      // Use POST with Turnstile token if available, otherwise fall back to GET
      const fetchOptions: RequestInit = turnstileToken 
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ turnstileToken })
          }
        : { method: 'GET' };
      
      const response = await fetch('/api/live-session', fetchOptions);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        apiKey = data.apiKey;
      } else {
        const text = await response.text();
        console.error("Received non-JSON response:", text.substring(0, 500));
        throw new Error("Invalid server response (not JSON)");
      }
    } catch (e) {
      console.error("Session initialization failed:", e);
      const errorMessage = e instanceof Error ? e.message : "Failed to initialize session. Please try again.";
      callbacks.onError(errorMessage);
      return;
    }

    if (!apiKey) {
      callbacks.onError("Service unavailable: Missing configuration.");
      return;
    }

    this.ai = new GoogleGenAI({ apiKey });
    await this.initializeAudioContext();

    const systemInstruction = this.buildSystemPrompt(config);

    try {
        this.session = await this.ai.live.connect({
          model: MODEL_NAME,
          callbacks: {
            onopen: async () => {
              callbacks.onOpen();
              
              // Ensure audio context is running (fixes autoplay issues)
              if (this.outputContext && this.outputContext.state === 'suspended') {
                await this.outputContext.resume();
              }
              
              await this.startAudioInput(callbacks);
              
              // The Gemini Live API requires user audio input to trigger a response.
              // We'll wait briefly for the mic to capture ambient audio, then the AI will respond.
              // The system prompt instructs it to speak first.
              console.log('Session connected - microphone active, AI will respond to audio input');
            },
            onmessage: async (msg) => this.handleMessage(msg, callbacks),
            onclose: (e) => callbacks.onClose(e),
            onerror: (e) => this.handleError(e, callbacks),
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction,
            inputAudioTranscription: {}, 
            outputAudioTranscription: {},
            tools: [{ functionDeclarations: [END_INTERVIEW_TOOL] }]
          },
        });
    } catch (err: unknown) {
        callbacks.onError(err instanceof Error ? err.message : "Failed to initiate session.");
    }
  }

  private async initializeAudioContext() {
    try {
      this.inputContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      this.outputContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      
      this.outputNode = this.outputContext.createGain();
      this.outputNode.connect(this.outputContext.destination);

      await this.inputContext.audioWorklet.addModule('/worklets/audio-processor.js');
    } catch (e) {
      console.error("AudioContext initialization failed", e);
    }
  }

  private buildSystemPrompt(config: InterviewConfig): string {
    let difficultyContext = '';
    let personaContext = '';
    let assessmentInstructions = '';
    
    // Clean up job title for the prompt
    const jobRole = config.jobTitle;

    switch (config.interviewType) {
      case 'Technical':
        const diff = config.difficulty || 'Medium';
        difficultyContext = `**Difficulty Level:** ${diff}`;
        
        personaContext = `You are **Panel AI**, a pragmatic and experienced **Senior Staff Engineer**.
        You are conducting a technical deep-dive for a **${jobRole}** candidate.
        
        **Tone & Style:**
        - Professional, direct, and slightly skeptical.
        - You value precision, efficiency, and scalability.
        - You dislike buzzwords; you want to know *how* things work under the hood.
        - If the candidate is vague, press them for technical details.`;

        if (diff === 'Easy') {
            assessmentInstructions = `
            - Topic 1: Fundamental concepts and basic definitions relevant to ${jobRole}.
            - Topic 2: A simple practical scenario (e.g., debugging a common issue).`;
        } else if (diff === 'Hard') {
            assessmentInstructions = `
            - Topic 1: Complex system design or architecture relevant to a Senior ${jobRole}.
            - Topic 2: Scalability, edge cases, and handling constraints (e.g., "10x traffic").
            - Topic 3: Deep dive into trade-offs (e.g., Consistency vs Availability, SQL vs NoSQL).`;
        } else {
            assessmentInstructions = `
            - Topic 1: Standard industry practices and patterns for ${jobRole}.
            - Topic 2: Code/Architecture explanation of a recent project.
            - Topic 3: Practical trade-off scenarios and decision making.`;
        }
        break;

      case 'Behavioral':
        personaContext = `You are **Panel AI**, a **Director of Engineering** or **Hiring Manager** focused on culture and leadership.
        You are interviewing a **${jobRole}** candidate to assess their soft skills.
        
        **Tone & Style:**
        - Professional, attentive, and emotionally intelligent.
        - You focus on the **STAR method** (Situation, Task, Action, Result).
        - You are looking for signs of ownership, conflict resolution, and growth mindset.
        - If the candidate uses "We" too much, ask "What exactly did *you* do?".`;
        
        assessmentInstructions = `
        - Topic 1: A time they faced a significant challenge or conflict. (Dig into their specific actions).
        - Topic 2: A time they failed or made a mistake. (Focus on ownership and learning).
        - Topic 3: Experience with cross-functional collaboration or disagreement.`;
        break;

      case 'General':
        personaContext = `You are **Panel AI**, a Senior **Technical Recruiter** at a top-tier tech company.
        You are conducting the initial phone screen for a **${jobRole}** position.
        
        **Tone & Style:**
        - Warm, energetic, professional, and structured.
        - You want to assess high-level fit, communication skills, and enthusiasm.
        - You are not testing deep technical code, but rather the candidate's background and career goals.`;
        
        assessmentInstructions = `
        - Topic 1: Their professional background and narrative ("Tell me about yourself").
        - Topic 2: Motivation for this specific ${jobRole} role and company fit.
        - Topic 3: Career goals, timeline, and what they are looking for next.`;
        break;
        
      default:
         personaContext = `You are Panel AI, a professional interviewer for the ${jobRole} position.`;
         assessmentInstructions = `Conduct a professional interview suitable for the role, covering experience, skills, and goals.`;
    }

    return SYSTEM_PROMPT_TEMPLATE
      .replace('{{JOB_TITLE}}', config.jobTitle)
      .replace('{{INTERVIEW_TYPE}}', config.interviewType)
      .replace('{{DIFFICULTY_CONTEXT}}', difficultyContext)
      .replace('{{PERSONA_CONTEXT}}', personaContext)
      .replace('{{CORE_ASSESSMENT_INSTRUCTIONS}}', assessmentInstructions)
      .replace('{{RESUME_CONTEXT}}', config.resumeContext || 'No resume provided.') + 
      "\n\nIMPORTANT: AS SOON AS THE SESSION STARTS, YOU MUST SPEAK FIRST. INTRODUCE YOURSELF AND THE INTERVIEW IMMEDIATELY. DO NOT WAIT FOR THE USER.";
  }

  private async startAudioInput(callbacks: GeminiLiveCallbacks) {
    if (!this.inputContext) return;
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.inputContext.createMediaStreamSource(this.mediaStream);

      this.workletNode = new AudioWorkletNode(this.inputContext, 'audio-recorder-processor');

      this.workletNode.port.onmessage = (event) => {
        if (this.isMuted || !this.session || this.isDisconnecting) return;

        const int16Data = new Int16Array(event.data);
        const base64 = encodeBase64(new Uint8Array(int16Data.buffer));
        
        if (this.session && !this.isDisconnecting) {
          this.session.sendRealtimeInput({
            media: {
              data: base64,
              mimeType: 'audio/pcm;rate=16000',
            }
          });
        }
      };

      source.connect(this.workletNode);
      this.workletNode.connect(this.inputContext.destination);
    } catch (err) {
      console.error("Microphone access failed", err);
      callbacks.onError("Microphone access denied.");
    }
  }

  private async handleMessage(message: LiveServerMessage, callbacks: GeminiLiveCallbacks) {
    // 1. Handle Transcriptions
    if (message.serverContent?.outputTranscription) {
      this.currentOutputTranscription += message.serverContent.outputTranscription.text;
      callbacks.onTranscript(this.currentOutputTranscription, 'AI', false, this.currentOutputTurnId);
    } else if (message.serverContent?.inputTranscription) {
      this.currentInputTranscription += message.serverContent.inputTranscription.text;
      callbacks.onTranscript(this.currentInputTranscription, 'Candidate', false, this.currentInputTurnId);
    }

    // 2. Handle Turn Completion (Reset IDs)
    if (message.serverContent?.turnComplete) {
      if (this.currentInputTranscription.trim()) callbacks.onTranscript(this.currentInputTranscription, 'Candidate', true, this.currentInputTurnId);
      if (this.currentOutputTranscription.trim()) callbacks.onTranscript(this.currentOutputTranscription, 'AI', true, this.currentOutputTurnId);
      
      this.currentInputTranscription = '';
      this.currentOutputTranscription = '';
      this.resetTurnIds();
    }

    // 3. Handle Tool Calls (End Interview)
    if (message.toolCall) {
        const functionCalls = message.toolCall.functionCalls;
        if (functionCalls) {
          const endCall = functionCalls.find(fc => fc.name === 'endInterview');
          if (endCall && this.session) {
              this.pendingEndSession = true;
              this.checkEndSession(callbacks);
              this.session.sendToolResponse({
                  functionResponses: [{ id: endCall.id, name: endCall.name, response: { result: "ok" } }]
              });
          }
        }
    }

    // 4. Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputContext && this.outputNode && !this.isDisconnecting) {
        try {
            const audioBytes = decodeBase64(base64Audio);
            // Calculate volume for visualizer
            const sum = audioBytes.reduce((acc, byte) => acc + Math.abs(byte - 128), 0);
            callbacks.onAudioData(sum / Math.min(audioBytes.length, 50));

            // Queue Audio
            this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
            const audioBuffer = await decodeAudioData(audioBytes, this.outputContext, OUTPUT_SAMPLE_RATE, 1);

            const source = this.outputContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNode);
            source.addEventListener('ended', () => {
                this.activeSources.delete(source);
                if (this.activeSources.size === 0) callbacks.onAiSpeaking(false);
                this.checkEndSession(callbacks);
            });
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.activeSources.add(source);
            if (this.activeSources.size === 1) callbacks.onAiSpeaking(true);

        } catch (e) { console.error("Audio playback error", e); }
    }

    // 5. Handle Interruption
    if (message.serverContent?.interrupted) {
      this.activeSources.forEach(s => { try { s.stop(); } catch { /* ignore */ } });
      this.activeSources.clear();
      callbacks.onAiSpeaking(false);
      this.nextStartTime = 0;
    }
  }

  private handleError(e: unknown, callbacks: GeminiLiveCallbacks) {
    console.error('Gemini Live Socket Error:', e);
    let msg = e instanceof Error ? e.message : 'Connection error';
    if (isQuotaError(e) || msg.includes('429')) msg = "QUOTA_EXCEEDED";
    callbacks.onError(msg);
  }

  private checkEndSession(callbacks: GeminiLiveCallbacks) {
      if (this.pendingEndSession && this.activeSources.size === 0) {
          this.pendingEndSession = false;
          setTimeout(() => callbacks.onEndSessionTriggered(), 1500);
      }
  }

  public setMute(muted: boolean) { this.isMuted = muted; }

  public async disconnect() {
    if (this.isDisconnecting) return;
    this.isDisconnecting = true;
    
    console.log('Starting disconnect...');

    // IMMEDIATELY stop all active audio sources
    this.activeSources.forEach(s => { 
      try { 
        s.stop(0); // Stop immediately, not scheduled
        s.disconnect();
      } catch (e) { 
        console.warn('Error stopping source:', e);
      } 
    });
    this.activeSources.clear();
    console.log('Stopped all audio sources');

    // Disconnect and null out the output node
    if (this.outputNode) {
      try { 
        this.outputNode.disconnect(); 
        this.outputNode.gain.value = 0; // Mute it
      } catch (e) {
        console.warn('Error disconnecting output node:', e);
      }
      this.outputNode = null;
    }

    if (this.workletNode) {
      try {
        this.workletNode.disconnect();
        this.workletNode.port.close();
      } catch (e) {
        console.warn('Error disconnecting worklet node:', e);
      }
      this.workletNode = null;
    }

    // Stop microphone stream
    if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
        this.mediaStream = null;
    }

    // Close WebSocket session
    if (this.session) {
      try { this.session.close(); } catch (e) {
        console.warn('Error closing session:', e);
      }
      this.session = null;
    }

    // Suspend contexts BEFORE closing (helps stop audio faster)
    const safeSuspendAndClose = async (ctx: AudioContext | null, name: string) => {
        if (!ctx) return;
        try {
          if (ctx.state === 'running') {
            await ctx.suspend();
            console.log(`Suspended ${name} context`);
          }
          if (ctx.state !== 'closed') {
            await ctx.close();
            console.log(`Closed ${name} context`);
          }
        } catch (e) {
          console.warn(`Error closing ${name} context:`, e);
        }
    };
    
    await Promise.all([
      safeSuspendAndClose(this.inputContext, 'input'),
      safeSuspendAndClose(this.outputContext, 'output')
    ]);
    
    this.inputContext = null;
    this.outputContext = null;
    
    console.log('Disconnect complete - all resources cleaned up');
  }
}
