import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Parallax Protocol — AI Agent Escrow & Validation',
  description:
    'Enterprise middleware for validating AI agent outputs against expected schemas. ' +
    'Real-time escrow settlement, semantic drift detection, and execution tracing.',
  keywords: ['AI agent', 'escrow', 'validation', 'schema drift', 'middleware'],
  authors: [{ name: 'Parallax Protocol' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Parallax Protocol',
    description: 'AI Agent Escrow & Validation Middleware',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4F46E5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-white antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'var(--font-inter)',
              fontSize: '13px',
            },
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  )
}
