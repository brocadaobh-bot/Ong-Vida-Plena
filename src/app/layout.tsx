import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default:  'Vida Plena — Gestão de Usuários e Capacitação',
    template: '%s | Vida Plena',
  },
  description: 'Plataforma de gestão da ONG Vida Plena para cursos, inscrições e capacitação comunitária.',
  keywords:    ['ONG', 'cursos', 'capacitação', 'inclusão digital', 'usuários'],
  authors:     [{ name: 'ONG Vida Plena' }],
  robots:      { index: false, follow: false },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0c0c0e' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
