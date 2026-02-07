'use client';

import React, { useState } from 'react';
import { generateInterviewFeedback } from '@/services/feedbackService';
import { FeedbackData, InterviewConfig, TranscriptItem } from '@/types';
import { QuotaModal } from './QuotaModal';
import { useTurnstile } from './Turnstile';

interface FeedbackScreenProps {
  transcript: TranscriptItem[];
  config: InterviewConfig;
  onRestart: () => void;
}

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ transcript, config, onRestart }) => {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const { token, TurnstileWidget } = useTurnstile();
  
  const handleGenerateFeedback = async () => {
    if (transcript.length === 0) return;
    setLoading(true);
    setErrorMsg(null);
    try {
        const data = await generateInterviewFeedback(transcript, config, token);
        setFeedback(data);
        setShowAnalysis(true);
    } catch (e: unknown) {
        if (e instanceof Error && e.message === 'QUOTA_EXCEEDED') {
            setShowQuotaModal(true);
        } else {
            setErrorMsg(e instanceof Error && e.name === 'RateLimitError' ? e.message : "Failed to generate report.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = () => {
      if (!feedback) return;
      const lines = [
          "PANEL AI REPORT",
          `Role: ${config.jobTitle}`,
          `Score: ${feedback.overallScore}/100`,
          "",
          "SUMMARY:",
          feedback.summary,
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PanelAI_Report_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-grow bg-transparent flex flex-col items-center p-4 md:p-8 overflow-y-auto min-h-0 scrollbar-hide">
      <QuotaModal isOpen={showQuotaModal} onClose={() => setShowQuotaModal(false)} />
      
      <div className="w-full max-w-4xl bg-white dark:bg-black border border-slate-200 dark:border-slate-800 flex flex-col mb-12 animate-fade-in relative transition-colors">
        
        <button onClick={onRestart} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-slate-400 hover:text-black dark:hover:text-white transition-all z-20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="px-6 py-8 md:px-10 md:py-12 border-b border-slate-100 dark:border-slate-900 pr-12">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 break-words">{config.jobTitle}</h1>
            <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{config.interviewType}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Session Report</span>
            </div>
        </div>

        <div className="p-6 md:p-10">
        {!showAnalysis ? (
             <div className="space-y-8">
                 <div>
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">Transcript Preview</h3>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 h-64 overflow-y-auto text-[11px] md:text-sm font-mono leading-relaxed text-slate-700 dark:text-slate-300 scrollbar-hide">
                        {transcript.length > 0 ? transcript.map((t) => (
                            <div key={t.id} className="mb-4">
                                <span className={`text-[9px] font-bold uppercase mr-2 tracking-wider ${t.speaker === 'AI' ? 'text-slate-400' : 'text-black dark:text-white'}`}>{t.speaker === 'AI' ? 'AI' : 'YOU'}</span>
                                <span className="opacity-80 break-words">{t.text}</span>
                            </div>
                        )) : <p className="italic text-center mt-20 opacity-50 text-[10px]">No dialogue recorded.</p>}
                    </div>
                 </div>
                 {errorMsg && <p className="text-[10px] text-red-600 dark:text-red-400 font-bold text-center italic">{errorMsg}</p>}
                 
                 <div className="flex flex-col sm:flex-row gap-4">
                     <button onClick={handleGenerateFeedback} disabled={loading || transcript.length === 0} className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all">{loading ? 'Analyzing...' : 'Generate Full Report'}</button>
                     <button onClick={onRestart} className="flex-1 py-4 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-black dark:hover:text-white transition-all">Discard</button>
                 </div>
             </div>
        ) : (
            <div className="animate-fade-in space-y-10 pb-4">
                 {feedback && (
                    <>
                        <div className="bg-slate-50 dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800">
                             <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Summary</h3>
                             <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-100 font-medium">&quot;{feedback.summary}&quot;</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="p-6 border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center">
                                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Score</h3>
                                <div className="text-6xl font-black text-black dark:text-white">{feedback.overallScore}</div>
                            </div>
                            <div className="p-6 border border-slate-200 dark:border-slate-800 lg:col-span-2 flex flex-col justify-center space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Clarity</h3>
                                    <span className="text-lg font-bold text-black dark:text-white">{feedback.speechAnalysis.clarityScore}/10</span>
                                </div>
                                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-black dark:bg-white" style={{ width: `${feedback.speechAnalysis.clarityScore * 10}%` }} /></div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">&quot;{feedback.speechAnalysis.feedback}&quot;</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Questions Review</h3>
                            <div className="space-y-10">
                                {feedback.questionAnalysis.map((qa, i) => (
                                    <div key={i} className="group">
                                        <div className="text-[10px] font-bold text-slate-400 mb-2">Q{i + 1}: {qa.question}</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pl-4 border-l-2 border-slate-200 dark:border-slate-800 group-hover:border-black transition-colors">
                                            <div className="space-y-1">
                                                <div className="text-[8px] uppercase font-bold text-slate-400 tracking-widest">Your Answer</div>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">&quot;{qa.userAnswer}&quot;</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[8px] uppercase font-bold text-emerald-600 tracking-widest">Ideal Approach</div>
                                                <p className="text-[11px] text-slate-800 dark:text-slate-200">{qa.idealAnswer}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100 dark:border-slate-900">
                             <button onClick={onRestart} className="flex-1 py-4 border border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-black">New Session</button>
                             <button onClick={handleDownload} className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest">Download</button>
                        </div>
                    </>
                 )}
            </div>
        )}
        </div>
      </div>
      <TurnstileWidget size="invisible" />
    </div>
  );
};
