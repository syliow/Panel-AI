# Panel AI

A realistic mock interview simulator powered by Google's Gemini AI. Practice your interview skills with an AI interviewer that adapts to your responses in real-time.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/syliow/Panel-AI)

## Features

- **Live Audio Interaction**: Real-time voice interaction using Gemini's native audio engine
- **Expert Personas**: AI adapts personality and questions based on role and interview type
- **Resume Analysis**: Upload your resume for personalized questions
- **Comprehensive Feedback**: Detailed scoring, speech analysis, and ideal answer templates

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Google Gemini API (Live Audio + Text generation)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/syliow/Panel-AI.git
   cd Panel-AI
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Netlify (Recommended)

1. **Connect Repository**: Link your GitHub repository to Netlify

2. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Set Environment Variables**:
   In Netlify dashboard → Site Settings → Environment Variables:

   ```
   GEMINI_API_KEY = your_gemini_api_key_here
   ```

4. **Deploy**: Netlify will automatically install `@netlify/plugin-nextjs`

### Manual Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable         | Description                | Required |
| ---------------- | -------------------------- | -------- |
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes      |

## Project Structure

```
Panel-AI/
├── src/
│   ├── app/
│   │   ├── api/              # Server-side API routes
│   │   │   ├── feedback/     # Feedback generation
│   │   │   ├── resume/       # Resume parsing
│   │   │   ├── suggestions/  # Job title suggestions
│   │   │   ├── validate-title/ # Job title validation
│   │   │   └── live-session/ # Live session initialization
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   ├── services/             # Client-side service layer
│   ├── utils/                # Utility functions
│   ├── constants.ts
│   └── types.ts
├── netlify.toml              # Netlify configuration
├── next.config.ts
├── tailwind.config.js
└── package.json
```

## Security

- API keys are stored server-side and never exposed in client bundles
- All AI API calls (except real-time audio) are routed through Next.js API routes
- Client-side rate limiting to prevent abuse
- Security headers configured for production

## License

MIT

## Author

Developed by [Shanyi Liow](https://liowshanyi.site)
