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

## Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API key

### Install

```bash
git clone https://github.com/syliow/Panel-AI.git
cd Panel-AI
npm install
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
```

## Deployment

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

| Variable         | Description                | Required |
| ---------------- | -------------------------- | -------- |
| `GEMINI_API_KEY` | Google Gemini API key      | Yes      |

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

- API keys stay server-side and are not bundled into client code.
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
