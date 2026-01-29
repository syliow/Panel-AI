# Panel AI 🎙️

Professional real-time interview simulation platform powered by Gemini Live.

## 📋 Project Outline

Panel AI is a voice-first application designed to simulate high-stakes job interviews. It provides a low-latency, natural conversational experience, allowing candidates to practice answering behavioral, technical, and general interview questions with a realistic AI persona.

### 🏛️ Architecture & Structure

The project is organized into functional categories to maintain scalability and readability:

*   **`components/`**: UI Building blocks (Layout, Setup, Interview, Feedback, etc.)
*   **`services/`**: Core logic and API integrations (Gemini Live, Resume Parsing, Validation)
*   **`hooks/`**: React custom hooks for session management and UI logic
*   **`utils/`**: Helper functions for audio processing, string manipulation, and API safety
*   **`types.ts`**: Global TypeScript definitions
*   **`constants.ts`**: Application configuration and system prompt templates

### ✨ Core Features

1.  **Real-Time Voice Call**: Low-latency interaction using Gemini 2.5 Flash Native Audio.
2.  **Adaptive Personas**: AI transitions between Hiring Manager, Tech Lead, or Recruiter based on session config.
3.  **Resume Integration**: Context-aware questioning based on uploaded candidate history.
4.  **Speech Analytics**: Post-interview analysis of WPM, filler words, and clarity.
5.  **Comparative Feedback**: "Ideal Answer" generation for self-improvement.

### 🛠️ Technical Implementation

*   **Audio Engine**: Manual PCM resampling (16kHz in / 24kHz out) for Gemini Live compatibility.
*   **UI/UX**: Responsive Tailwind CSS design with dark mode, ambient mesh backgrounds, and reactive visualizers.
*   **State Management**: Complex session lifecycle handling including inactivity timeouts and manual disconnects.

## 🚀 Getting Started

1.  Set your `API_KEY` in the environment.
2.  Grant microphone permissions.
3.  Choose your target role and begin.

*Note: Requires a browser supporting Web Audio and getUserMedia.*