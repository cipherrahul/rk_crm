import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/Toast'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Ledger Pro | Professional Ledger Management',
  description: 'Secure, real-time ledger management for parties, commissions, and transactions.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <Script id="theme-init" strategy="beforeInteractive">{`
          try {
            const t = localStorage.theme;
            const dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
          } catch(_) {}
        `}</Script>
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
