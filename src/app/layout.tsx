import type { Metadata } from 'next'
import { Analytics } from "@vercel/analytics/next"
import './globals.css'

export const metadata: Metadata = {
  title: 'Panel AI - Realistic Mock Interview',
  description: 'Practice your interview skills with Google Gemini powered AI Adaptable Interviewer.',
  metadataBase: new URL('https://www.panelai.site'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased h-screen overflow-hidden selection:bg-indigo-500/30">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
