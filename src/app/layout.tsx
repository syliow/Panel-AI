import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Panel AI',
  description: 'Realistic Mock Interview powered by AI',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' fill='none'%3E%3Cstyle%3E@media (prefers-color-scheme: dark) { rect { fill: %23ffffff !important; } }%3C/style%3E%3Crect x='8' y='8' width='8' height='24' fill='%230f172a' /%3E%3Crect x='20' y='8' width='4' height='24' fill='%230f172a' opacity='0.6' /%3E%3Crect x='28' y='8' width='4' height='24' fill='%230f172a' opacity='0.3' /%3E%3C/svg%3E",
  },
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
      </body>
    </html>
  )
}
