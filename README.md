# Panel AI 🎙️

Panel AI is a real-time voice interview simulator. It's designed to help people practice for high-stakes job interviews by actually *speaking* with an AI, rather than just typing text.

We built this to mimic the flow of a real Zoom/Google Meet screening. The AI doesn't just wait for a prompt; it has a persona, it interrupts if needed, and it follows a structured interview flow (Intro -> Experience -> Technical/Behavioral -> Closing).

## Core Features

*   **Real-Time Voice Conversation:** This isn't speech-to-text converted to a text prompt. We use the Gemini Live API to stream audio directly to the model and back. It feels much more natural and has very low latency.
*   **Dynamic Personas:**
    *   **Technical Interview:** The AI acts like a strict Engineering Lead. It asks progressive questions (Easy -> Hard).
    *   **Behavioral Interview:** The AI acts like a Department Manager, looking for STAR method answers.
    *   **General Interview:** The AI acts like a Recruiter, checking for culture fit and career goals.
*   **Resume Context:** You can upload a PDF/Image of your resume. The AI reads it before the call starts and asks specific questions about your actual project history.
*   **Live Transcripts:** See what's being said in real-time (useful if you missed a word).
*   **Post-Interview Report:** Once you hang up, the app generates a detailed scorecard including:
    *   0-100 Rating.
    *   Speech analysis (WPM, filler words, clarity).
    *   "Ideal Answer" generation (comparing what you said vs. what a 10/10 candidate would say).

## Design & UI

We went for a "Glassmorphic" aesthetic. Since it's a voice-first app, the UI needs to be unobtrusive but reassuring.
*   **Visuals:** Dark/Light mode support with ambient, animated mesh backgrounds to make it feel "alive" without being distracting.
*   **Audio Visualizer:** A simple reactive ring around the mute button so you know the app is actually hearing you.
*   **Tech:** Built with React, Tailwind CSS, and standard Web Audio APIs.

## Technical Constraints & "Gotchas"

If you're digging into the code, here are a few things to keep in mind:

1.  **Browser Audio is Hard:** The Gemini Live API expects raw PCM audio at specific sample rates (16kHz input, 24kHz output). We handle the downsampling manually in `utils/audioUtils.ts`. If the audio sounds chipmunk-y or slow, it's usually a sample rate mismatch.
2.  **API Key Requirement:** This uses the Gemini **Live** API (Multimodal). You need a paid tier API key from Google AI Studio. The free tier keys often don't support the WebSocket/Live connection reliably yet.
3.  **No "Interrupt" Button:** We rely on the model's ability to handle interruptions, but technically we are just streaming audio. If you talk over the AI, it *should* stop, but it depends heavily on the model's current tuning.
4.  **Race Conditions:** Managing the state between "User finished speaking", "Model thinking", and "Model speaking" is tricky. We use a push-to-talk style logic internally for transcripts to avoid duplicate bubbles, even though the UX is hands-free.

## Security Note 🔒

This application runs entirely in the browser (Client-Side). 
*   **API Key Exposure:** The `API_KEY` is injected via `process.env` during the build. In a production environment, this means the key is visible in the source code to anyone who inspects the network traffic or bundle.
*   **Best Practice:** For public deployments, restrict your API Key in the Google Cloud Console to only allow requests from your specific domain (Referrer restriction). Alternatively, deploy a proxy server to handle authentication securely.
*   **Source Code:** Ensure `.env` files containing your keys are **never** committed to version control. This project includes a `.gitignore` to prevent this.

## Running Locally

1.  Clone the repo.
2.  `npm install`
3.  Create a `.env` file and set `API_KEY=your_key_here`.
4.  `npm start`

*Note: You must run this on `localhost` or `https`. Browsers block microphone access on insecure `http` origins.*