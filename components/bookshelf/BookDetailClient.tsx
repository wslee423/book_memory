'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Book, BookPage } from '@/types'
import { StarRating } from '@/components/ui/StarRating'
import { BookPageItem } from '@/components/bookshelf/BookPageItem'

type TabType = 'all' | 'highlight' | 'memo' | 'ai_chat' | 'diary'

interface AdjacentBook {
  id: string
  title: string
}

interface BookDetailClientProps {
  book: Book
  pages: BookPage[]
  prev: AdjacentBook | null
  next: AdjacentBook | null
}

const TAB_LABELS: { key: TabType; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'highlight', label: '하이라이트' },
  { key: 'memo', label: '메모' },
  { key: 'ai_chat', label: 'AI대화' },
  { key: 'diary', label: '일기' },
]

function formatReadPeriod(readStart: string | null, readEnd: string | null): string {
  const fmt = (d: string) => d.replace(/-/g, '.').slice(0, 10)
  if (readStart && readEnd) return `${fmt(readStart)} ~ ${fmt(readEnd)}`
  if (readStart) return fmt(readStart)
  if (readEnd) return fmt(readEnd)
  return '-'
}

// ── 하위 컴포넌트들 ────────────────────────────────────────────

function BookDetailMeta({ book }: { book: Book }) {
  return (
    <section className="flex gap-6 mb-8">
      <div className="flex-shrink-0">
        {book.coverUrl ? (
          <div className="relative w-[140px] h-[196px] sm:w-[200px] sm:h-[280px] rounded overflow-hidden shadow-md">
            <Image
              src={book.coverUrl}
              alt={book.title}
              width={200}
              height={280}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-[140px] h-[196px] sm:w-[200px] sm:h-[280px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm rounded shadow-md">
            표지 없음
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{book.title}</h1>
        {book.author && <p className="text-gray-600">{book.author}</p>}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {book.category && (
            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded border border-blue-200">
              {book.category}
            </span>
          )}
          {book.status && (
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
              {book.status}
            </span>
          )}
          {book.rating && (
            <span className="text-sm">
              <StarRating rating={book.rating} />
            </span>
          )}
        </div>
        {(book.readStart ?? book.readEnd) && (
          <p className="text-sm text-gray-500">
            {formatReadPeriod(book.readStart, book.readEnd)}
          </p>
        )}
        {book.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {book.keywords.map((kw) => (
              <span key={kw} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {kw}
              </span>
            ))}
          </div>
        )}
        {book.oneWord.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {book.oneWord.map((w) => (
              <span key={w} className="bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded-full border border-yellow-200">
                {w}
              </span>
            ))}
          </div>
        )}
        {book.summary && (
          <p className="text-sm text-gray-700 border-l-4 border-gray-200 pl-3 mt-1">
            {book.summary}
          </p>
        )}
        {book.review && (
          <p className="text-sm text-gray-600 italic mt-1">&ldquo;{book.review}&rdquo;</p>
        )}
      </div>
    </section>
  )
}

function BookDetailPages({
  pages,
  activeTab,
  onTabChange,
}: {
  pages: BookPage[]
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}) {
  const filteredPages =
    activeTab === 'all' ? pages : pages.filter((p) => p.contentType === activeTab)

  return (
    <section>
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {TAB_LABELS.map(({ key, label }) => {
          const count = key === 'all' ? pages.length : pages.filter((p) => p.contentType === key).length
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {count > 0 && <span className="ml-1 text-xs text-gray-400">({count})</span>}
            </button>
          )
        })}
      </div>
      {filteredPages.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-1">
          {filteredPages.map((page) => (
            <BookPageItem key={page.id} page={page} />
          ))}
        </div>
      )}
    </section>
  )
}

// ── 본체 ──────────────────────────────────────────────────────

export function BookDetailClient({ book, pages, prev, next }: BookDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-4xl mx-auto">
      <Link
        href="/bookshelf"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        ← 책장으로 돌아가기
      </Link>
      <BookDetailMeta book={book} />
      <BookDetailPages pages={pages} activeTab={activeTab} onTabChange={setActiveTab} />
      <nav className="flex justify-between mt-12 pt-6 border-t">
        {prev ? (
          <Link href={`/bookshelf/${prev.id}`} className="text-gray-600 hover:text-gray-900">
            ← 이전: {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/bookshelf/${next.id}`} className="text-gray-600 hover:text-gray-900">
            다음: {next.title} →
          </Link>
        ) : <span />}
      </nav>
    </main>
  )
}
