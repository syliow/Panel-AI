export type InterviewType = 'Behavioral' | 'Technical' | 'General';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface InterviewConfig {
  jobTitle: string;
  interviewType: InterviewType;
  difficulty?: DifficultyLevel;
  resumeContext?: string; // Extracted text from uploaded resume
}

export interface TranscriptItem {
  id: string;
  speaker: 'AI' | 'Candidate';
  text: string;
  timestamp: number;
  isPartial?: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AudioVisualizerState {
  volume: number;
}

export interface FeedbackMetric {
  category: string;
  score: number; // 1-10
  reason: string;
}

export interface QuestionAnalysis {
  question: string;
  userAnswer: string;
  feedback: string;
  idealAnswer: string;
}

export interface FeedbackData {
  strengths: string[];
  improvements: string[];
  summary: string;
  metrics: FeedbackMetric[];
  overallScore: number; // 0-100
  questionAnalysis: QuestionAnalysis[];
  speechAnalysis: {
    wpm: number; // Estimated words per minute
    fillerWordCount: number; // Estimated count of "um", "uh", "like"
    clarityScore: number; // 1-10
    feedback: string;
  };
}