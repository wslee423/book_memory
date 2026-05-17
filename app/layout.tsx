import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GlobalNav } from '@/components/ui/GlobalNav'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '나의 책장',
  description: 'AI 독서 비서 — 읽은 책과 생각을 다시 꺼내는 도구',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <GlobalNav />
        {children}
      </body>
    </html>
  )
}
