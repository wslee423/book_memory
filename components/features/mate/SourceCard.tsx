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
      className="block rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm hover:border-blue-300 hover:bg-blue-50 transition-colors"
    >
      <p className="font-medium text-gray-800 mb-1">📖 {source.bookTitle}</p>
      <p className="text-gray-500 line-clamp-2">&ldquo;{source.excerpt}&hellip;&rdquo;</p>
    </Link>
  )
}
