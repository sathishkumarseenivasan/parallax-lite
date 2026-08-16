import type { Metadata } from 'next'
import LandingClient from '@/components/landing/LandingClient'

export const metadata: Metadata = {
  title: 'Parallax Protocol | AI Agent Settlement Infrastructure',
  description: 'Parallax holds every agent-to-agent payment in escrow, verifies the output mathematically, and releases funds only when the work is correct. Hallucinations get refunded. Automatically.',
  keywords: ['AI agents', 'escrow', 'settlement', 'middleware', 'trustless', 'verification'],
  alternates: {
    canonical: 'https://parallax.example.com',
  },
  openGraph: {
    title: 'Parallax Protocol | AI Agent Settlement Infrastructure',
    description: 'Parallax holds every agent-to-agent payment in escrow, verifies the output mathematically, and releases funds only when the work is correct.',
    url: 'https://parallax.example.com',
    siteName: 'Parallax Protocol',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Parallax Protocol',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parallax Protocol | AI Agent Settlement Infrastructure',
    description: 'Parallax holds every agent-to-agent payment in escrow, verifies the output mathematically, and releases funds only when the work is correct.',
    images: ['/og-image.svg'],
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function Page() {
  return <LandingClient />
}
