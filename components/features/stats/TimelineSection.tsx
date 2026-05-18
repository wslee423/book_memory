'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { TimelineMonth } from '@/types'
import { StarRating } from '@/components/ui/StarRating'

export function TimelineSection({ timeline }: { timeline: TimelineMonth[] }) {
  if (timeline.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">완독 기록이 없습니다.</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
      <div className="flex flex-col gap-10">
        {timeline.map(({ month, label, books }) => (
          <div key={month} className="flex gap-6">
            <div className="w-20 shrink-0 text-right">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 leading-tight whitespace-pre-line">
                {label.replace('년 ', '년\n')}
              </span>
            </div>
            <div className="relative flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white dark:border-gray-950 shadow mt-0.5 shrink-0" />
            </div>
            <div className="flex-1 flex flex-col gap-3 pb-2">
              <p className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5">{books.length}권</p>
              {books.map((book) => (
                <Link
                  key={book.id}
                  href={`/bookshelf/${book.id}`}
                  className="flex gap-3 p-3 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                >
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      width={48}
                      height={64}
                      className="w-12 h-16 object-cover rounded shadow-sm shrink-0 ring-1 ring-black/5 dark:ring-white/10"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-100 dark:bg-gray-800 rounded shrink-0 flex items-center justify-center text-gray-300 dark:text-gray-600 text-xs">
                      없음
                    </div>
                  )}
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
                      {book.title}
                    </p>
                    {book.author && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{book.author}</p>
                    )}
                    <div className="flex items-center gap-2 mt-auto">
                      {book.rating && <StarRating rating={book.rating} />}
                      {book.category && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{book.category}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
