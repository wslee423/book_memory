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
          <div className="overflow-hidden rounded shadow-sm group-hover:shadow-md transition-shadow ring-1 ring-black/5 dark:ring-white/10">
            {book.coverUrl ? (
              <div className="relative aspect-[5/7]">
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 17vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[5/7] bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                표지 없음
              </div>
            )}
          </div>
          <div className="px-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
              {book.title}
            </p>
            {book.author && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{book.author}</p>
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
