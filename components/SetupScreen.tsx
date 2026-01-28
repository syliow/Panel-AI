import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { DIFFICULTY_DESCRIPTIONS, INTERVIEW_TYPE_DESCRIPTIONS, INTERVIEW_TYPES } from '../constants';
import { parseResume } from '../services/resumeService';
import { validateJobTitle } from '../services/validationService';
import { DifficultyLevel, InterviewConfig, InterviewType } from '../types';
import { toTitleCase } from '../utils/stringUtils';
import { QuotaModal } from './QuotaModal';
import { InfoModal } from './InfoModal';

interface SetupScreenProps {
  onStart: (config: InterviewConfig) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [interviewType, setInterviewType] = useState<InterviewType>('Behavioral');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResumeInfo, setShowResumeInfo] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  const suggestionTimeoutRef = useRef<number>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to hide suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete prediction logic using Flash Lite for speed
  useEffect(() => {
    if (jobTitle.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (suggestionTimeoutRef.current) window.clearTimeout(suggestionTimeoutRef.current);

    suggestionTimeoutRef.current = window.setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: `Provide exactly 5 highly professional and common job titles that start with or are closely related to: "${jobTitle}". Return as a raw JSON array of strings only.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        });
        const result = JSON.parse(response.text || '[]');
        const filtered = result.filter((s: string) => s.toLowerCase() !== jobTitle.toLowerCase());
        setSuggestions(filtered);
        if (filtered.length > 0) setShowSuggestions(true);
      } catch (e) {
        console.error("Suggestion error", e);
      } finally {
        setIsSuggesting(false);
      }
    }, 300); // 300ms debounce for near-instant feel

    return () => {
      if (suggestionTimeoutRef.current) window.clearTimeout(suggestionTimeoutRef.current);
    };
  }, [jobTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    setShowSuggestions(false);

    let resumeContext = '';
    const formattedJobTitle = toTitleCase(jobTitle.trim());

    try {
        if (resumeFile) {
            setIsParsingResume(true);
            resumeContext = await parseResume(resumeFile);
            setIsParsingResume(false);
        }

        const validation = await validateJobTitle(formattedJobTitle);
        if (!validation.isValid) {
            setError(validation.message || "Please enter a valid job title.");
            setIsSubmitting(false);
            return;
        }

        onStart({ 
          jobTitle: formattedJobTitle, 
          interviewType,
          difficulty: interviewType === 'Technical' ? difficulty : undefined,
          resumeContext
        });
    } catch (err: any) {
        console.error(err);
        if (err.message === 'QUOTA_EXCEEDED') {
            setShowQuotaModal(true);
        } else if (err.name === 'RateLimitError') {
            setError(err.message);
        } else {
            setError("Setup failed. Please check your connection and try again.");
        }
        setIsSubmitting(false);
        setIsParsingResume(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-transparent overflow-y-auto scrollbar-hide relative">
      <QuotaModal isOpen={showQuotaModal} onClose={() => setShowQuotaModal(false)} />
      
      <InfoModal 
        isOpen={showResumeInfo} 
        onClose={() => setShowResumeInfo(false)} 
        title="Resume Personalization"
        content={
          <div className="space-y-4">
            <p>Upload your resume to let the AI know about your background. This helps the AI ask you about your specific skills and projects instead of generic questions.</p>
            <ul className="list-disc pl-5 space-y-2 text-xs font-medium">
              <li><strong className="text-black dark:text-white">Personalized For You:</strong> The AI references your specific projects and past roles.</li>
              <li><strong className="text-black dark:text-white">Smart Questions:</strong> The AI asks deeper follow-up questions based on your actual work history.</li>
              <li><strong className="text-black dark:text-white">Private & Secure:</strong> Your resume is processed on-the-fly and never stored permanently.</li>
            </ul>
          </div>
        }
      />

      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
        <div className="w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02),transparent_65%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_65%)] blur-2xl opacity-70" />
      </div>
      
      <div className="w-full max-w-lg bg-slate-50/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 p-8 md:p-12 animate-fade-in my-auto shadow-2xl relative transition-all duration-300 z-10 backdrop-blur-sm">
        
        <div className="mb-16">
            <h1 className="text-7xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85] select-none">
              Panel <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-400 to-slate-900 dark:from-slate-600 dark:to-white">AI</span>
            </h1>
            <div className="flex items-center gap-4 mt-6">
                <div className="h-[2px] w-10 bg-slate-900 dark:bg-white"></div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.35em]">
                  Realistic Mock Interview
                </p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-10">
            <div className="flex flex-col space-y-2 relative" ref={dropdownRef}>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">
                  Target Role
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="e.g. Senior Software Engineer"
                    className={`w-full bg-transparent border-b-2 py-2 text-xl font-medium text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-700 focus:outline-none transition-colors rounded-none ${
                        error 
                        ? 'border-red-500' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-black dark:focus:border-white'
                    }`}
                    value={jobTitle}
                    onFocus={() => {
                        // Only show if we already have suggestions and user has typed enough
                        if (suggestions.length > 0 && jobTitle.length >= 3) setShowSuggestions(true);
                    }}
                    onChange={(e) => {
                        setJobTitle(e.target.value);
                        if (error) setError(null);
                    }}
                  />
                  
                  {isSuggesting && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-200 dark:border-slate-800 border-t-black dark:border-t-white rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Autocomplete Suggestions UI */}
                  {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-20 mt-1 flex flex-col overflow-hidden">
                          {suggestions.map((s, i) => (
                              <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                      setJobTitle(s);
                                      setSuggestions([]);
                                      setShowSuggestions(false);
                                  }}
                                  className="px-4 py-3 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors"
                              >
                                  {s}
                              </button>
                          ))}
                      </div>
                  )}
                </div>
            </div>

            <div className="flex flex-col space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">
                  Interview Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERVIEW_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInterviewType(type)}
                      className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${
                        interviewType === type
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                          : 'bg-white/50 dark:bg-black/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[2.5rem] font-medium">
                  {INTERVIEW_TYPE_DESCRIPTIONS[interviewType]}
                </p>
            </div>

            {interviewType === 'Technical' && (
              <div className="flex flex-col space-y-4 animate-fade-in">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">
                  Difficulty Level
                </label>
                <div className="flex gap-8">
                  {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-all duration-300 ${
                        difficulty === level
                          ? 'border-black text-black dark:border-white dark:text-white'
                          : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[2.5rem] font-medium">
                  {DIFFICULTY_DESCRIPTIONS[difficulty]}
                </p>
              </div>
            )}

            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600 flex items-center gap-1.5">
                    Personalize with Resume 
                    <span className="text-slate-400 dark:text-slate-500 font-medium ml-1 text-[11px] whitespace-nowrap transition-all">(Optional)</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowResumeInfo(true)}
                    className="p-1 text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                
                <div className="relative group">
                    <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        className="block w-full text-[10px] text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-slate-900 dark:file:bg-white file:text-white dark:file:text-black file:cursor-pointer hover:file:opacity-80 transition-all border-2 border-dashed border-slate-200 dark:border-slate-800 p-4 bg-white/30 dark:bg-black/30 group-hover:border-slate-300 dark:group-hover:border-slate-700"
                    />
                </div>
            </div>
            
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-mono animate-fade-in leading-relaxed font-bold text-center">
                    {error}
                  </p>
                </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!jobTitle.trim() || isSubmitting}
              className={`w-full py-5 text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl flex items-center justify-center gap-3 ${
                !jobTitle.trim() || isSubmitting
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-black text-white dark:bg-white dark:text-black hover:translate-y-[-2px] hover:shadow-2xl active:translate-y-[0px]'
              }`}
            >
              {isParsingResume ? 'Reading Resume...' : isSubmitting ? 'Starting Session...' : (
                <>
                  Begin Interview
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};