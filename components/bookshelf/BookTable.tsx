'use client'

import { useRouter } from 'next/navigation'
import type { Book } from '@/types'
import { StarRating } from '@/components/ui/StarRating'

interface BookTableProps {
  books: Book[]
}

function formatReadPeriod(readStart: string | null, readEnd: string | null): string {
  const fmt = (d: string) => d.replace(/-/g, '.').slice(0, 10)
  if (readStart && readEnd) return `${fmt(readStart)} ~ ${fmt(readEnd)}`
  if (readStart) return fmt(readStart)
  if (readEnd) return fmt(readEnd)
  return '-'
}

export function BookTable({ books }: BookTableProps) {
  const router = useRouter()

  if (books.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        조건에 맞는 책이 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-700">제목</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">저자</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">분류</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">상태</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">별점</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">읽은 기간</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">한단어감상</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">한줄 요약</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr
              key={book.id}
              onClick={() => router.push(`/bookshelf/${book.id}`)}
              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                {book.title}
              </td>
              <td className="px-4 py-3 text-gray-600">{book.author ?? '-'}</td>
              <td className="px-4 py-3 text-gray-600">{book.category ?? '-'}</td>
              <td className="px-4 py-3">
                {book.status ? (
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                    {book.status}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-4 py-3">
                <StarRating rating={book.rating} />
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {formatReadPeriod(book.readStart, book.readEnd)}
              </td>
              <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                {book.oneWord.length > 0 ? book.oneWord.join(', ') : '-'}
              </td>
              <td className="px-4 py-3 text-gray-600 max-w-[240px]">
                <p className="line-clamp-2">{book.summary ?? '-'}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
