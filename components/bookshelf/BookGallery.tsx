'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Book } from '@/types'
import { StarRating } from '@/components/ui/StarRating'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'

interface BookGalleryProps {
  books: Book[]
}

export function BookGallery({ books }: BookGalleryProps) {
  if (books.length === 0) {
    return <EmptyState message="조건에 맞는 책이 없습니다." />
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/bookshelf/${book.id}`}
          className="flex flex-col gap-2 group"
        >
          <div className="overflow-hidden rounded shadow-sm group-hover:shadow-md transition-shadow">
            {book.coverUrl ? (
              <div className="relative aspect-[5/7]">
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  width={200}
                  height={280}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[5/7] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                표지 없음
              </div>
            )}
          </div>
          <div className="px-0.5">
            <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
              {book.title}
            </p>
            {book.author && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{book.author}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <StarRating rating={book.rating} />
              <StatusBadge status={book.status} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
