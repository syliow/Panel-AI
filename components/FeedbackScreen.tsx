import React, { useState } from 'react';
import { generateInterviewFeedback } from '../services/feedbackService';
import { FeedbackData, InterviewConfig, TranscriptItem } from '../types';
import { QuotaModal } from './QuotaModal';

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

  const handleGenerateFeedback = async () => {
    if (transcript.length === 0) return;
    setLoading(true);
    setErrorMsg(null);
    try {
        const data = await generateInterviewFeedback(transcript, config);
        setFeedback(data);
        setShowAnalysis(true);
    } catch (e: any) {
        if (e.message === 'QUOTA_EXCEEDED') {
            setShowQuotaModal(true);
        } else if (e.name === 'RateLimitError') {
            setErrorMsg(e.message);
        } else {
            setErrorMsg("Failed to generate report.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = () => {
      if (!feedback) return;

      const lines = [
          "PANEL AI - INTERVIEW REPORT",
          "===========================",
          `Role: ${config.jobTitle}`,
          `Date: ${new Date().toLocaleString()}`,
          "",
          `OVERALL SCORE: ${feedback.overallScore}/100`,
          "",
          "SPEECH ANALYSIS:",
          `Clarity: ${feedback.speechAnalysis.clarityScore}/10`,
          `Filler Words (Est): ${feedback.speechAnalysis.fillerWordCount}`,
          `Feedback: ${feedback.speechAnalysis.feedback}`,
          "",
          "IDEAL ANSWERS:",
          ...feedback.questionAnalysis.map(qa => `\nQ: ${qa.question}\nYour Answer: ${qa.userAnswer}\nBetter Answer: ${qa.idealAnswer}\n`),
          "",
          "SUMMARY:",
          feedback.summary,
      ];

      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PanelAI_Report_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-grow bg-transparent flex flex-col items-center p-4 md:p-8 overflow-y-auto min-h-0 scrollbar-hide">
      <QuotaModal isOpen={showQuotaModal} onClose={() => setShowQuotaModal(false)} />
      
      <div className="w-full max-w-4xl bg-white dark:bg-black border border-slate-200 dark:border-slate-800 flex flex-col mb-12 animate-fade-in flex-none relative transition-colors duration-500">
        
        {/* Close Button (X) */}
        <button 
          onClick={onRestart}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-black dark:hover:text-white transition-all z-20"
          aria-label="Close session report"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-10 py-12 border-b border-slate-100 dark:border-slate-900 pr-16">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">{config.jobTitle}</h1>
            <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {config.interviewType}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Session Report
                </span>
            </div>
        </div>

        {/* Content Area */}
        <div className="p-10">
        {!showAnalysis ? (
             <div className="space-y-10">
                 <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Transcript Preview</h3>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 h-64 overflow-y-auto text-sm font-mono leading-relaxed text-slate-700 dark:text-slate-300 scrollbar-hide">
                        {transcript.length > 0 ? (
                            transcript.map((t) => (
                                <div key={t.id} className="mb-4">
                                    <span className={`text-[9px] font-bold uppercase mr-3 tracking-wider ${t.speaker === 'AI' ? 'text-slate-400' : 'text-black dark:text-white'}`}>
                                        {t.speaker === 'AI' ? 'AI' : 'YOU'}
                                    </span>
                                    <span className="opacity-80">{t.text}</span>
                                </div>
                            ))
                        ) : (
                            <p className="italic text-center mt-20 opacity-50">No dialogue recorded.</p>
                        )}
                    </div>
                 </div>
                 
                 {errorMsg && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-mono text-center">
                        {errorMsg}
                    </div>
                 )}

                 <div className="flex flex-col sm:flex-row gap-6 justify-center">
                     <button 
                        onClick={handleGenerateFeedback}
                        disabled={loading || transcript.length === 0}
                        className="flex-1 py-4 px-8 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                     >
                        {loading ? 'Analyzing Session...' : 'Generate Full Report'}
                     </button>
                     <button 
                        onClick={onRestart}
                        className="flex-1 py-4 px-8 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all"
                     >
                        Discard & Exit
                     </button>
                 </div>
             </div>
        ) : (
            <div className="animate-fade-in space-y-12 pb-4">
                 {feedback && (
                    <>
                        {/* Summary Section */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800">
                             <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Executive Summary</h3>
                             <p className="text-sm md:text-base leading-relaxed text-slate-900 dark:text-slate-100 font-medium">"{feedback.summary}"</p>
                        </div>

                        {/* Scores Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-8 border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Overall Score</h3>
                                <div className="text-7xl font-black text-black dark:text-white">{feedback.overallScore}</div>
                            </div>
                            <div className="p-8 border border-slate-200 dark:border-slate-800 md:col-span-2 flex flex-col justify-center">
                                <div className="flex justify-between items-end mb-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Speech Clarity</h3>
                                    <span className="text-xl font-bold text-black dark:text-white">{feedback.speechAnalysis.clarityScore}/10</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div 
                                          className="h-full bg-black dark:bg-white transition-all duration-1000" 
                                          style={{ width: `${feedback.speechAnalysis.clarityScore * 10}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                                        Feedback: {feedback.speechAnalysis.feedback}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Analysis */}
                        <div className="space-y-8">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-black dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">
                                Detailed Question Review
                            </h3>
                            <div className="grid grid-cols-1 gap-8">
                                {feedback.questionAnalysis.map((qa, i) => (
                                    <div key={i} className="group">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Question {i + 1}</div>
                                        <div className="text-lg font-bold text-slate-900 dark:text-white mb-6">"{qa.question}"</div>
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pl-4 border-l-2 border-slate-200 dark:border-slate-800 group-hover:border-black dark:group-hover:border-white transition-colors">
                                            <div>
                                                <div className="text-[9px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Your Answer</div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                                    "{qa.userAnswer}"
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-500 mb-2 tracking-widest">Ideal Approach</div>
                                                <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                                                    {qa.idealAnswer}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 pt-12 border-t border-slate-100 dark:border-slate-900">
                             <button 
                                onClick={onRestart} 
                                className="flex-1 py-4 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors"
                             >
                                New Session
                             </button>
                             <button 
                                onClick={handleDownload} 
                                className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                             >
                                Download Transcript
                             </button>
                        </div>
                    </>
                 )}
            </div>
        )}
        </div>
      </div>
    </div>
  );
};