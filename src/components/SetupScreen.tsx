'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DIFFICULTY_DESCRIPTIONS, INTERVIEW_TYPE_DESCRIPTIONS, INTERVIEW_TYPES } from '@/constants';
import { parseResume } from '@/services/resumeService';
import { validateJobTitle } from '@/services/validationService';
import { DifficultyLevel, InterviewConfig, InterviewType } from '@/types';
import { toTitleCase } from '@/utils/stringUtils';
import { QuotaModal } from './QuotaModal';
import { InfoModal } from './InfoModal';
import { useJobTitleSuggestions } from '@/hooks/useJobTitleSuggestions';

interface SetupScreenProps {
  onStart: (config: InterviewConfig) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>('Behavioral');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResumeInfo, setShowResumeInfo] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  const { suggestions, clearSuggestions } = useJobTitleSuggestions(jobTitle);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHover = (e: React.MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
  };

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
    } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error && err.message === 'QUOTA_EXCEEDED') {
            setShowQuotaModal(true);
        } else {
            setError("Setup failed. Please check your connection.");
        }
        setIsSubmitting(false);
        setIsParsingResume(false);
    }
  };

  const handleSuggestionClick = (s: string) => {
    setJobTitle(s);
    clearSuggestions();
    setShowSuggestions(false);
  };

  return (
    <div className="h-full flex flex-col relative bg-transparent">
      <QuotaModal isOpen={showQuotaModal} onClose={() => setShowQuotaModal(false)} />
      
      {/* Floating Tooltip Component */}
      {tooltip && (
        <div 
          className="fixed z-[100] pointer-events-none"
          style={{ 
            left: `${tooltip.x}px`, 
            top: `${tooltip.y}px`,
          }}
        >
          <div className="transform -translate-x-1/2 -translate-y-full">
            <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold tracking-tight rounded shadow-2xl px-3 py-2 text-center animate-fade-in max-w-[200px] relative">
              {tooltip.text}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900 dark:border-t-slate-100"></div>
            </div>
          </div>
        </div>
      )}

      <InfoModal 
        isOpen={showResumeInfo} 
        onClose={() => setShowResumeInfo(false)} 
        title="Resume Personalization"
        content={
          <div className="space-y-4">
            <p>Upload your resume to let the AI know about your background. This helps the AI ask you about your specific skills and projects instead of generic questions.</p>
            <ul className="list-disc pl-5 space-y-2 text-xs font-medium">
              <li><strong className="text-black dark:text-white">Personalized For You:</strong> References your specific achievements.</li>
              <li><strong className="text-black dark:text-white">Smart Questions:</strong> Deep follow-up probes.</li>
            </ul>
          </div>
        }
      />

      <div className="flex-1 w-full overflow-y-auto scrollbar-hide flex flex-col items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-lg bg-slate-50/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 p-6 md:p-12 animate-fade-in shadow-2xl relative transition-all duration-300 z-10 backdrop-blur-sm my-auto">
          
          <div className="mb-8 md:mb-12">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85] select-none">
                Panel <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-400 to-slate-900 dark:from-slate-600 dark:to-white">AI</span>
              </h1>
              <div className="flex items-center gap-3 mt-4 md:mt-6">
                  <div className="h-[2px] w-6 md:w-10 bg-slate-900 dark:bg-white"></div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.35em]">
                    Realistic Mock Interview
                  </p>
              </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 md:space-y-12">
            <div className="space-y-8 md:space-y-10">
              {/* Job Title */}
              <div className="flex flex-col space-y-2 relative" ref={dropdownRef}>
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">Target Role</label>
                  <input
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="e.g. Lead Developer"
                      className={`w-full bg-transparent border-b-2 py-2 text-xl font-medium text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-700 focus:outline-none transition-colors rounded-none ${
                          error ? 'border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-black dark:focus:border-white'
                      }`}
                      value={jobTitle}
                      onFocus={() => { if (suggestions.length > 0 && jobTitle.length >= 3) setShowSuggestions(true); }}
                      onChange={(e) => {
                          setJobTitle(e.target.value);
                          if (error) setError(null);
                          if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-20 mt-1 flex flex-col overflow-hidden">
                          {suggestions.map((s, i) => (
                              <button key={i} type="button" onClick={() => handleSuggestionClick(s)} className="px-4 py-3 text-left text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                  {s}
                              </button>
                          ))}
                      </div>
                  )}
              </div>

              {/* Interview Type */}
              <div className="flex flex-col space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">Interview Type</label>
                  <div className="flex flex-wrap gap-2">
                    {INTERVIEW_TYPES.map((type) => (
                      <button 
                        key={type} 
                        type="button" 
                        onClick={() => setInterviewType(type)}
                        onMouseEnter={(e) => handleHover(e, INTERVIEW_TYPE_DESCRIPTIONS[type])}
                        onMouseLeave={() => setTooltip(null)}
                        className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          interviewType === type ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                      }`}>
                        {type}
                      </button>
                    ))}
                  </div>
              </div>

              {/* Difficulty */}
              {interviewType === 'Technical' && (
                <div className="flex flex-col space-y-3 animate-fade-in">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">Difficulty</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((level) => (
                      <button 
                        key={level} 
                        type="button" 
                        onClick={() => setDifficulty(level)}
                        onMouseEnter={(e) => handleHover(e, DIFFICULTY_DESCRIPTIONS[level])}
                        onMouseLeave={() => setTooltip(null)}
                        className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          difficulty === level ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                      }`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume */}
              <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">Resume (Optional)</label>
                    <button type="button" onClick={() => setShowResumeInfo(true)} className="text-slate-300 hover:text-black dark:hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  <input type="file" accept=".pdf,.txt" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="block w-full text-[10px] text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-slate-900 dark:file:bg-white file:text-white dark:file:text-black border-2 border-dashed border-slate-200 dark:border-slate-800 p-3 bg-white/30 dark:bg-black/30" />
              </div>
              
              {error && <p className="text-[10px] text-red-600 dark:text-red-400 font-bold text-center italic">{error}</p>}
            </div>

            <button type="submit" disabled={!jobTitle.trim() || isSubmitting} className={`w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl flex items-center justify-center gap-3 ${
                  !jobTitle.trim() || isSubmitting ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none' : 'bg-black text-white dark:bg-white dark:text-black hover:translate-y-[-2px]'
              }`}>
                {isParsingResume ? 'Parsing...' : isSubmitting ? 'Starting...' : 'Begin Interview'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
