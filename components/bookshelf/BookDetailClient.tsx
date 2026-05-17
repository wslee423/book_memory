'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Book, BookPage, ContentType } from '@/types'
import { StarRating } from '@/components/ui/StarRating'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BookPageItem } from '@/components/bookshelf/BookPageItem'
import { BookEditForm } from '@/components/bookshelf/BookEditForm'
import { MemoForm } from '@/components/bookshelf/MemoForm'
import { formatReadPeriod } from '@/lib/utils/format'

type TabKey = 'all' | Exclude<ContentType, 'image'>

interface AdjacentBook {
  id: string
  title: string
}

interface BookDetailClientProps {
  book: Book
  pages: BookPage[]
  prev: AdjacentBook | null
  next: AdjacentBook | null
  categories: string[]
}

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'highlight', label: '하이라이트' },
  { key: 'memo', label: '메모' },
  { key: 'ai_chat', label: 'AI대화' },
  { key: 'diary', label: '일기' },
]

function BookDetailMeta({ book }: { book: Book }) {
  return (
    <section className="flex gap-6 mb-8">
      <BookCover coverUrl={book.coverUrl} title={book.title} />
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{book.title}</h1>
        {book.author && <p className="text-gray-600">{book.author}</p>}
        <BookMetaBadges book={book} />
        {(book.readStart ?? book.readEnd) && (
          <p className="text-sm text-gray-500">
            {formatReadPeriod(book.readStart, book.readEnd)}
          </p>
        )}
        <BookKeywords keywords={book.keywords} oneWord={book.oneWord} />
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

function BookCover({ coverUrl, title }: { coverUrl: string | null; title: string }) {
  const sizeClass = 'w-[140px] h-[196px] sm:w-[200px] sm:h-[280px]'
  if (!coverUrl) {
    return (
      <div className={`flex-shrink-0 ${sizeClass} bg-gray-200 flex items-center justify-center text-gray-400 text-sm rounded shadow-md`}>
        표지 없음
      </div>
    )
  }
  return (
    <div className={`flex-shrink-0 relative ${sizeClass} rounded overflow-hidden shadow-md`}>
      <Image
        src={coverUrl}
        alt={title}
        width={200}
        height={280}
        className="w-full h-full object-cover"
      />
    </div>
  )
}

function BookMetaBadges({ book }: { book: Book }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {book.category && (
        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded border border-blue-200">
          {book.category}
        </span>
      )}
      <StatusBadge status={book.status} />
      {book.rating && (
        <span className="text-sm">
          <StarRating rating={book.rating} />
        </span>
      )}
    </div>
  )
}

function BookKeywords({ keywords, oneWord }: { keywords: string[]; oneWord: string[] }) {
  return (
    <>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <span key={kw} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      )}
      {oneWord.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {oneWord.map((w) => (
            <span key={w} className="bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded-full border border-yellow-200">
              {w}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

function BookDetailPages({
  pages,
  activeTab,
  onTabChange,
  onPageUpdated,
  onPageDeleted,
}: {
  pages: BookPage[]
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  onPageUpdated: (updated: BookPage) => void
  onPageDeleted: (pageId: string) => void
}) {
  const countsByType = useMemo(() => {
    const counts: Record<TabKey, number> = { all: pages.length, highlight: 0, memo: 0, ai_chat: 0, diary: 0 }
    for (const p of pages) {
      if (p.contentType !== 'image') counts[p.contentType]++
    }
    return counts
  }, [pages])

  const filteredPages = useMemo(
    () => (activeTab === 'all' ? pages : pages.filter((p) => p.contentType === activeTab)),
    [pages, activeTab],
  )

  return (
    <section>
      <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
        {TAB_LABELS.map(({ key, label }) => {
          const count = countsByType[key]
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
        <div className="flex flex-col gap-2">
          {filteredPages.map((page) => (
            <div key={page.id} className="group">
              <BookPageItem page={page} onUpdated={onPageUpdated} onDeleted={onPageDeleted} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AdjacentNav({ prev, next }: { prev: AdjacentBook | null; next: AdjacentBook | null }) {
  return (
    <nav className="flex justify-between gap-4 mt-12 pt-6 border-t text-sm">
      <div className="min-w-0">
        {prev && (
          <Link href={`/bookshelf/${prev.id}`} className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <span className="shrink-0">←</span>
            <span className="truncate">{prev.title}</span>
          </Link>
        )}
      </div>
      <div className="min-w-0 text-right">
        {next && (
          <Link href={`/bookshelf/${next.id}`} className="text-gray-600 hover:text-gray-900 flex items-center gap-1 justify-end">
            <span className="truncate">{next.title}</span>
            <span className="shrink-0">→</span>
          </Link>
        )}
      </div>
    </nav>
  )
}

export function BookDetailClient({ book: initialBook, pages: initialPages, prev, next, categories }: BookDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [pages, setPages] = useState<BookPage[]>(initialPages)
  const [book, setBook] = useState<Book>(initialBook)
  const [editing, setEditing] = useState(false)

  function handlePageSaved(newPage: BookPage) {
    setPages((prev) => [...prev, newPage])
    setActiveTab(newPage.contentType === 'image' ? 'all' : newPage.contentType as TabKey)
  }

  function handlePageUpdated(updated: BookPage) {
    setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  function handlePageDeleted(pageId: string) {
    setPages((prev) => prev.filter((p) => p.id !== pageId))
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/bookshelf"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← 책장으로 돌아가기
        </Link>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:border-gray-500 hover:text-gray-900 transition-colors"
          >
            책 정보 수정
          </button>
        )}
      </div>

      {editing ? (
        <div className="mb-8">
          <BookEditForm
            book={book}
            categories={categories}
            onSaved={(updated) => { setBook(updated); setEditing(false) }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <BookDetailMeta book={book} />
      )}

      <div className="mb-6">
        <MemoForm bookId={book.id} onSaved={handlePageSaved} />
      </div>
      <BookDetailPages
        pages={pages}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPageUpdated={handlePageUpdated}
        onPageDeleted={handlePageDeleted}
      />
      <AdjacentNav prev={prev} next={next} />
    </main>
  )
}
