'use client'

import { useRouter } from 'next/navigation'
import type { Book } from '@/types'
import { StarRating } from '@/components/ui/StarRating'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatReadPeriod } from '@/lib/utils/format'

interface BookTableProps {
  books: Book[]
}

const COLUMNS: { key: string; label: string }[] = [
  { key: 'title', label: '제목' },
  { key: 'author', label: '저자' },
  { key: 'category', label: '분류' },
  { key: 'status', label: '상태' },
  { key: 'rating', label: '별점' },
  { key: 'period', label: '읽은 기간' },
  { key: 'oneWord', label: '한단어감상' },
  { key: 'summary', label: '한줄 요약' },
]

export function BookTable({ books }: BookTableProps) {
  const router = useRouter()

  if (books.length === 0) {
    return <EmptyState message="조건에 맞는 책이 없습니다." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            {COLUMNS.map((c) => (
              <th key={c.key} className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr
              key={book.id}
              onClick={() => router.push(`/bookshelf/${book.id}`)}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                {book.title}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{book.author ?? '-'}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{book.category ?? '-'}</td>
              <td className="px-4 py-3">
                {book.status ? <StatusBadge status={book.status} /> : '-'}
              </td>
              <td className="px-4 py-3">
                <StarRating rating={book.rating} />
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {formatReadPeriod(book.readStart, book.readEnd)}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[160px] truncate">
                {book.oneWord.length > 0 ? book.oneWord.join(', ') : '-'}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[240px]">
                <p className="line-clamp-2">{book.summary ?? '-'}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
