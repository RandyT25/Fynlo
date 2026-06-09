import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/providers'
import { Toaster } from '@/components/ui/sonner'

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: 'Fynlo — Smart Money Management',
    template: '%s | Fynlo',
  },
  description: 'A modern budgeting and money management platform. Track income, expenses, goals, and build better financial habits.',
  keywords: ['budgeting', 'personal finance', 'money management', 'expense tracker', 'savings goals'],
  authors: [{ name: 'Fynlo' }],
  creator: 'Fynlo',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fynlo',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'Fynlo',
    title: 'Fynlo — Smart Money Management',
    description: 'A modern budgeting and money management platform.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fynlo — Smart Money Management',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: '/fynlo-icon-color.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <Providers>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
