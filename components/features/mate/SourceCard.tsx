'use client'

import Link from 'next/link'
import type { ChatSource } from '@/types'

interface SourceCardProps {
  source: ChatSource
}

export function SourceCard({ source }: SourceCardProps) {
  return (
    <Link
      href={`/bookshelf/${source.bookId}`}
      className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 text-sm hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
    >
      <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">📖 {source.bookTitle}</p>
      <p className="text-gray-500 dark:text-gray-400 line-clamp-2">&ldquo;{source.excerpt}&hellip;&rdquo;</p>
    </Link>
  )
}
