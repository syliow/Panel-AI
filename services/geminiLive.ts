import { FunctionDeclaration, GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { MODEL_NAME, SYSTEM_PROMPT_TEMPLATE } from '../constants';
import { InterviewConfig } from '../types';
import { createPcmBlob, decodeAudioData, decodeBase64 } from '../utils/audioUtils';
import { isQuotaError } from '../utils/apiUtils';

// Audio Context Constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

export interface GeminiLiveCallbacks {
  onOpen: () => void;
  onClose: (event: CloseEvent) => void;
  onError: (event: any) => void;
  onAudioData: (visualizerData: number) => void;
  onTranscript: (text: string, speaker: 'AI' | 'Candidate', isFinal: boolean, turnId: string) => void;
  onEndSessionTriggered: () => void;
  onAiSpeaking: (isSpeaking: boolean) => void;
}

const endInterviewTool: FunctionDeclaration = {
  name: 'endInterview',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
  description: 'Call this function to end the interview session when the conversation is concluded.',
};

export class GeminiLiveService {
  private ai: GoogleGenAI | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private sessionPromise: Promise<any> | null = null; 
  private isMuted: boolean = false;
  private isDisconnecting: boolean = false;
  
  // Transcription state
  private currentInputTranscription: string = '';
  private currentOutputTranscription: string = '';
  private currentInputTurnId: string = 'user-' + Math.random().toString(36).substring(7);
  private currentOutputTurnId: string = 'ai-' + Math.random().toString(36).substring(7);

  // Session ending state
  private pendingEndSession: boolean = false;

  constructor() {}

  public async connect(config: InterviewConfig, callbacks: GeminiLiveCallbacks) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      callbacks.onError("Service unavailable: Missing configuration.");
      return;
    }
    this.ai = new GoogleGenAI({ apiKey });

    // Initialize Audio
    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: INPUT_SAMPLE_RATE,
      });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);
    } catch (e) {
      console.error("Failed to initialize AudioContext");
    }

    // Dynamic prompt logic
    let difficultyContext = '';
    let personaContext = '';
    let assessmentInstructions = '';

    if (config.interviewType === 'Technical') {
        const diff = config.difficulty || 'Medium';
        difficultyContext = `**Difficulty Level:** ${diff}`;
        personaContext = `You are Panel AI, an expert Engineering Lead conducting a technical interview for the ${config.jobTitle} position.`;
        if (diff === 'Easy') assessmentInstructions = `Ask basic fundamental questions.`;
        else if (diff === 'Hard') assessmentInstructions = `Ask complex system design and performance questions.`;
        else assessmentInstructions = `Ask standard coding and practical scenario questions.`;
    } else {
        personaContext = `You are Panel AI, a Senior Hiring Manager conducting a ${config.interviewType} interview.`;
        assessmentInstructions = `Ask role-specific behavioral or general screening questions.`;
    }

    const systemInstruction = SYSTEM_PROMPT_TEMPLATE
      .replace('{{JOB_TITLE}}', config.jobTitle)
      .replace('{{INTERVIEW_TYPE}}', config.interviewType)
      .replace('{{DIFFICULTY_CONTEXT}}', difficultyContext)
      .replace('{{PERSONA_CONTEXT}}', personaContext)
      .replace('{{CORE_ASSESSMENT_INSTRUCTIONS}}', assessmentInstructions)
      .replace('{{RESUME_CONTEXT}}', config.resumeContext || 'No resume provided.');

    try {
        this.sessionPromise = this.ai.live.connect({
          model: MODEL_NAME,
          callbacks: {
            onopen: async () => {
              callbacks.onOpen();
              await this.startAudioCapture();
            },
            onmessage: async (message: LiveServerMessage) => {
              this.handleMessage(message, callbacks);
            },
            onclose: (e) => callbacks.onClose(e),
            onerror: (e) => {
                console.error('Gemini Live Socket Error:', e instanceof Error ? e.message : String(e));
                let message = e instanceof Error ? e.message : 'Connection error';
                if (isQuotaError(e) || message.includes('429')) {
                    message = "QUOTA_EXCEEDED";
                } else if (message.includes('not implemented') || message.includes('not found')) {
                   message = 'Live session failed. Please ensure your configuration supports real-time features.';
                }
                callbacks.onError(message);
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: systemInstruction,
            inputAudioTranscription: {}, 
            outputAudioTranscription: {},
            tools: [{ functionDeclarations: [endInterviewTool] }]
          },
        });
    } catch (err: any) {
        callbacks.onError(err.message || "Failed to initiate session.");
    }
  }

  private async startAudioCapture() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!this.inputAudioContext) return;

      this.inputSource = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.scriptProcessor = this.inputAudioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (this.isMuted || !this.sessionPromise || this.isDisconnecting) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        
        this.sessionPromise?.then((session) => {
            if (this.isDisconnecting) return;
            session.sendRealtimeInput({ media: pcmBlob });
        }).catch(() => {});
      };

      this.inputSource.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.inputAudioContext.destination);
    } catch (err) {
      console.error("Mic access failed");
    }
  }

  private async handleMessage(message: LiveServerMessage, callbacks: GeminiLiveCallbacks) {
    if (message.serverContent?.outputTranscription) {
      this.currentOutputTranscription += message.serverContent.outputTranscription.text;
      callbacks.onTranscript(this.currentOutputTranscription, 'AI', false, this.currentOutputTurnId);
    } else if (message.serverContent?.inputTranscription) {
      this.currentInputTranscription += message.serverContent.inputTranscription.text;
      callbacks.onTranscript(this.currentInputTranscription, 'Candidate', false, this.currentInputTurnId);
    }

    if (message.serverContent?.turnComplete) {
      if (this.currentInputTranscription.trim()) {
        callbacks.onTranscript(this.currentInputTranscription, 'Candidate', true, this.currentInputTurnId);
      }
      if (this.currentOutputTranscription.trim()) {
        callbacks.onTranscript(this.currentOutputTranscription, 'AI', true, this.currentOutputTurnId);
      }
      
      // Reset for next turn - ensures fresh IDs for new messages
      this.currentInputTranscription = '';
      this.currentOutputTranscription = '';
      this.currentInputTurnId = 'user-' + Math.random().toString(36).substring(7);
      this.currentOutputTurnId = 'ai-' + Math.random().toString(36).substring(7);
    }

    if (message.toolCall) {
        for (const fc of message.toolCall.functionCalls) {
            if (fc.name === 'endInterview') {
                this.pendingEndSession = true;
                this.checkEndSession(callbacks);
                this.sessionPromise?.then(session => session.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                }));
            }
        }
    }

    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext && this.outputNode && !this.isDisconnecting) {
        try {
            const audioBytes = decodeBase64(base64Audio);
            let sum = 0;
            const sampleSize = Math.min(audioBytes.length, 50);
            for(let i=0; i<sampleSize; i++) sum += Math.abs(audioBytes[i] - 128);
            callbacks.onAudioData(sum / sampleSize);

            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(audioBytes, this.outputAudioContext, OUTPUT_SAMPLE_RATE, 1);

            const source = this.outputAudioContext.createBufferSource();
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
        } catch (e) { 
            console.error("Audio error during playback");
        }
    }

    if (message.serverContent?.interrupted) {
      this.activeSources.forEach(s => { try { s.stop(); } catch(e){} });
      this.activeSources.clear();
      callbacks.onAiSpeaking(false);
      this.nextStartTime = 0;
    }
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

    if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
        this.mediaStream = null;
    }

    if (this.sessionPromise) {
      const session = await this.sessionPromise;
      if (session && session.close) try { session.close(); } catch(e) {}
      this.sessionPromise = null;
    }

    this.activeSources.forEach(s => { try { s.stop(); } catch(e){} });
    this.activeSources.clear();

    // Fix for "Cannot close a closed AudioContext"
    if (this.inputAudioContext) {
        if (this.inputAudioContext.state !== 'closed') {
            try { await this.inputAudioContext.close(); } catch(e) {}
        }
        this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
        if (this.outputAudioContext.state !== 'closed') {
            try { await this.outputAudioContext.close(); } catch(e) {}
        }
        this.outputAudioContext = null;
    }
  }
}