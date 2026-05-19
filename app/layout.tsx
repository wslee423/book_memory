import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GlobalNav } from '@/components/ui/GlobalNav'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'book_memory',
  description: 'AI 독서 비서 — 읽은 책과 생각을 다시 꺼내는 도구',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('theme')
                if (stored !== 'light') {
                  document.documentElement.classList.add('dark')
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-950`}>
        <GlobalNav />
        {children}
      </body>
    </html>
  )
}
