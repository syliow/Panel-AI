import React, { useState } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { InterviewScreen } from './components/InterviewScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { InterviewConfig, TranscriptItem } from './types';
import { Layout } from './components/Layout';
import { InfoModal } from './components/InfoModal';
import { APP_DESCRIPTION } from './constants';

type Screen = 'setup' | 'interview' | 'feedback';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const handleStart = (newConfig: InterviewConfig) => {
    setConfig(newConfig);
    setTranscript([]);
    setScreen('interview');
  };

  const handleEndSession = (finalTranscript: TranscriptItem[]) => {
    setTranscript(finalTranscript);
    setScreen('feedback');
  };

  const handleRestart = () => {
    setConfig(null);
    setTranscript([]);
    setScreen('setup');
  };

  return (
    <Layout onShowGuide={() => setShowGuide(true)}>
      {showGuide && (
        <InfoModal 
          isOpen={showGuide} 
          onClose={() => setShowGuide(false)} 
          title="How Panel AI Works"
          content={
            <div className="space-y-6">
              <p className="text-sm leading-relaxed">{APP_DESCRIPTION}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Live Audio
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Real-time low-latency voice interaction using Gemini's native audio engine. Speak naturally, no typing required.</p>
                </div>
                
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Expert Personas
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">The AI adapts its personality and questions based on your target role and the interview type you select.</p>
                </div>

                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Personalized Context
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Optionally upload your resume. The AI analyzes it to ask you about your specific career highlights and past projects.</p>
                </div>

                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Insightful Feedback
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">At the end, receive a comprehensive report with overall scores, speech analysis, and ideal answer templates.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-900">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Onboarding Guide</h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                    <p className="text-xs leading-relaxed"><span className="font-bold text-slate-900 dark:text-white">Target Your Role:</span> Enter the job title. Predictions will help you choose standard titles for better AI accuracy.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                    <p className="text-xs leading-relaxed"><span className="font-bold text-slate-900 dark:text-white">Personalize with Resume (Optional):</span> Upload your resume to give the interviewer more context about your specific background and past projects.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                    <p className="text-xs leading-relaxed"><span className="font-bold text-slate-900 dark:text-white">Start Interview:</span> Speak naturally. The AI will introduce itself and begin the structured assessment flow.</p>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      )}

      {screen === 'setup' && (
        <SetupScreen onStart={handleStart} />
      )}
      
      {screen === 'interview' && config && (
        <InterviewScreen 
            config={config} 
            onEndSession={handleEndSession} 
        />
      )}

      {screen === 'feedback' && config && (
          <FeedbackScreen 
            transcript={transcript} 
            config={config} 
            onRestart={handleRestart} 
          />
      )}
    </Layout>
  );
};

export default App;
