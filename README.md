# Panel AI

Panel AI is a mock interview app built on Next.js that uses Google Gemini for live audio and text responses. It lets you run realistic interview sessions, get targeted feedback, and practice with role-specific personas.

<img width="1639" height="940" alt="panelAiImg" src="https://github.com/user-attachments/assets/180f2b3a-f90d-490b-baaf-eee372a7a9d1" />

## Features

- Live voice interviews via Gemini streaming audio.
- Role-aware personas tuned to the job title.
- Behavioral, Technical, and General interview modes.
- Technical difficulty levels: Easy, Medium, Hard.
- Job title validation with live suggestions.
- Resume parsing for personalized questions.
- Feedback report with scores, strengths, and ideal answers.
- Speech metrics: pace, filler words, clarity.
- API rate limiting to curb abuse.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Google Gemini API
- Netlify

## Built with AI Agents

I built this project to learn how to effectively integrate AI agents into a real-world workflow and to explore how different model options perform under practical constraints:

- **Cursor**: Used as an AI partner to speed up development and handle the architectural implementation.
- **Model Choice (Gemini Flash vs. Gemma 4)**: I originally used Gemini Flash but moved to Gemma 4 (after a brief period on Gemma 3) mid-development because the free-tier rate limits were too restrictive for a real-time experience.
- **The Result**: Switching to **Gemma 4 26B-A4B-IT** provided better rate limits at zero cost. Even though it's a smaller model compared to the largest ones, it works perfectly for this project when paired with solid parsing logic and error handling.
- **Prompt Optimization**: Refined the system instructions through multiple iterations to ensure the AI maintains a consistent persona and handles multi-phase interview flows without losing focus.

## Getting Started

### Prerequisites

- Node.js 22
- Google Gemini API key

### Install

```bash
git clone https://github.com/syliow/Panel-AI.git
cd Panel-AI
npm ci
```

### Environment

Create a `.env.local` file at the project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Scripts

```bash
npm run dev     # local development server
npm run build   # production build
npm run start   # start production server
npm run lint    # lint
npm test        # tests
npm run typecheck # TypeScript validation
```

## Deployment

### EC2 with Docker, Kubernetes, and Helm

Follow the [deployment guide](docs/deployment.md) to build the standalone Docker image, connect to an existing EC2 instance, install k3s, and deploy with Helm. Images are copied over SSH and imported directly into k3s; no registry or Terraform setup is needed.

The chart runs one replica with health probes, resource limits, and a NodePort Service on port 30080. Updates briefly interrupt the app. Supply `GEMINI_API_KEY` through a Kubernetes Secret. `GET /api/health` checks application process health without calling Gemini.


### Netlify

1. Connect the GitHub repository in Netlify.
2. Use the build command `npm run build` and publish directory `.next`.
3. Add the `GEMINI_API_KEY` environment variable in Site Settings.

Netlify installs `@netlify/plugin-nextjs` automatically.

### Manual

```bash
npm run build
npm run start
```

## Environment Variables

| Variable         | Description           | Required |
| ---------------- | --------------------- | -------- |
| `GEMINI_API_KEY` | Google Gemini API key | Yes      |

## Project Structure

```
src/
  app/
    api/
      feedback/        # Feedback generation
      resume/          # Resume parsing
      suggestions/     # Job title suggestions
      validate-title/  # Job title validation
      live-session/    # Live session initialization
    globals.css
    layout.tsx
    page.tsx
  components/          # UI components
  hooks/               # Custom hooks
  services/            # Client-side service layer
  utils/               # Utility functions
  constants.ts
  types.ts
```

## Security Notes

- API keys are supplied at runtime and excluded from the Docker build. The existing Live-session endpoint returns the Gemini key to the browser for its direct connection; see [security notes](SECURITY.md).
- Most AI calls are routed through Next.js API routes (live audio uses Gemini streaming).
- Basic client-side rate limiting is in place to reduce abuse.

## Product Notes

Panel AI is designed to feel like a real call, not a chat box. The flow focuses on:

- Voice-first interaction: users start the session by speaking, which triggers the interviewer prompt immediately.
- Realistic structure: question sequencing is tuned to mirror a real interview (intro, core questions, follow-ups, wrap-up).
- Personalization: resume context and job title shape the interview so it feels specific, not generic.
- Actionable feedback: the session ends with concrete scoring and examples so users can improve quickly.

## Author

Developed by [Shanyi Liow](https://liowshanyi.site).
