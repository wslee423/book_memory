'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import type { ApiResponse, Book, BookStats, FilterState, ViewMode } from '@/types'
import { SORT_OPTIONS, type SortOption } from '@/lib/constants/book'
import { BookGallery } from '@/components/bookshelf/BookGallery'
import { BookTable } from '@/components/bookshelf/BookTable'
import { BookFilter } from '@/components/bookshelf/BookFilter'

interface BookshelfClientProps {
  initialBooks: Book[]
  stats: BookStats
  allKeywords: string[]
}

const DEFAULT_FILTERS: FilterState = {
  status: '',
  category: '',
  rating: null,
  keywords: [],
}

const SEARCH_DEBOUNCE_MS = 300

const SELECT_CLASS =
  'border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400'

function buildSearchParams(filters: FilterState, search: string, sort: SortOption): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.category) params.set('category', filters.category)
  if (filters.rating !== null) params.set('rating', String(filters.rating))
  if (filters.keywords.length > 0) params.set('keywords', filters.keywords.join(','))
  if (search) params.set('search', search)
  if (sort !== 'read_end_desc') params.set('sort', sort)
  return params
}

function useBookshelf(initialBooks: Book[]) {
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('read_end_desc')
  const [viewMode, setViewMode] = useState<ViewMode>('gallery')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const isInitialState =
    searchQuery === '' &&
    filters.status === '' &&
    filters.category === '' &&
    filters.rating === null &&
    filters.keywords.length === 0 &&
    sort === 'read_end_desc'

  const loadBooks = useCallback(async (signal: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const params = buildSearchParams(filters, searchQuery, sort)
      const res = await fetch(`/api/books?${params.toString()}`, { signal })
      const json = (await res.json()) as ApiResponse<Book[]>
      if (!res.ok || json.error) throw new Error(json.error ?? '알 수 없는 오류')
      if (!signal.aborted) setBooks(json.data ?? [])
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [filters, sort, searchQuery])

  useEffect(() => {
    if (isInitialState) {
      abortRef.current?.abort()
      setBooks(initialBooks)
      setError(null)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller
    const t = setTimeout(() => { void loadBooks(controller.signal) }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [isInitialState, initialBooks, loadBooks])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const book of initialBooks) {
      if (book.category) set.add(book.category)
    }
    return Array.from(set).sort()
  }, [initialBooks])

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    setSearchQuery('')
    setSort('read_end_desc')
  }

  const retry = () => {
    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller
    void loadBooks(controller.signal)
  }

  return {
    books, filters, setFilters, searchQuery, setSearchQuery,
    sort, setSort, viewMode, setViewMode, loading, error,
    categories, handleReset, retry,
  }
}

function BookshelfHeader({ stats }: { stats: BookStats }) {
  const items: { label: string; value: number }[] = [
    { label: '전체', value: stats.total },
    { label: '완독', value: stats.completed },
    { label: '이번 달', value: stats.thisMonth },
  ]
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {items.map((it) => (
        <div key={it.label} className="bg-gray-50 rounded-lg px-4 py-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{it.value}</p>
          <p className="text-sm text-gray-500 mt-0.5">{it.label}</p>
        </div>
      ))}
    </div>
  )
}

function BookshelfSearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="mb-4">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="제목, 저자, 요약, 리뷰 검색..."
        className="w-full max-w-md border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
      />
    </div>
  )
}

function BookshelfControls({
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: {
  sort: SortOption
  onSortChange: (s: SortOption) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className={SELECT_CLASS}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="flex gap-1">
        {(['gallery', 'table'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${
              viewMode === mode
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {mode === 'gallery' ? '갤러리' : '표'}
          </button>
        ))}
      </div>
    </div>
  )
}

function BookshelfContent({
  loading,
  error,
  books,
  viewMode,
  onRetry,
}: {
  loading: boolean
  error: string | null
  books: Book[]
  viewMode: ViewMode
  onRetry: () => void
}) {
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }
  if (loading) return <BookSkeleton viewMode={viewMode} />
  if (viewMode === 'gallery') return <BookGallery books={books} />
  return <BookTable books={books} />
}

export function BookshelfClient({ initialBooks, stats, allKeywords }: BookshelfClientProps) {
  const {
    books, filters, setFilters, searchQuery, setSearchQuery,
    sort, setSort, viewMode, setViewMode, loading, error,
    categories, handleReset, retry,
  } = useBookshelf(initialBooks)

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <BookshelfHeader stats={stats} />
        <Link
          href="/bookshelf/new"
          className="shrink-0 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + 책 등록
        </Link>
      </div>
      <BookshelfSearchBar value={searchQuery} onChange={setSearchQuery} />
      <div className="mb-4">
        <BookFilter
          filters={filters}
          categories={categories}
          allKeywords={allKeywords}
          onFilterChange={setFilters}
          onReset={handleReset}
        />
      </div>
      <BookshelfControls
        sort={sort}
        onSortChange={setSort}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <BookshelfContent
        loading={loading}
        error={error}
        books={books}
        viewMode={viewMode}
        onRetry={retry}
      />
    </main>
  )
}

function BookSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'table') {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-[5/7] bg-gray-100 rounded animate-pulse" />
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
        </div>
      ))}
    </div>
  )
}
