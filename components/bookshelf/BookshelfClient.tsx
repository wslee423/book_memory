'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Book, BookStats, FilterState } from '@/types'
import { BookGallery } from '@/components/bookshelf/BookGallery'
import { BookTable } from '@/components/bookshelf/BookTable'
import { BookFilter } from '@/components/bookshelf/BookFilter'

type SortOption = 'read_end_desc' | 'rating_desc' | 'created_at_asc' | 'title_asc'

interface BookshelfClientProps {
  initialBooks: Book[]
  stats: BookStats
  allKeywords: string[]
}

const DEFAULT_FILTERS: FilterState = {
  status: '',
  category: '',
  rating: '',
  keywords: [],
}

function useBookshelf(initialBooks: Book[]) {
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('read_end_desc')
  const [viewMode, setViewMode] = useState<'gallery' | 'table'>('gallery')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isInitialState =
    searchQuery === '' &&
    filters.status === '' &&
    filters.category === '' &&
    filters.rating === '' &&
    filters.keywords.length === 0 &&
    sort === 'read_end_desc'

  const loadBooks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.category) params.set('category', filters.category)
      if (filters.rating) params.set('rating', filters.rating)
      if (filters.keywords.length > 0) params.set('keywords', filters.keywords.join(','))
      if (searchQuery) params.set('search', searchQuery)
      if (sort !== 'read_end_desc') params.set('sort', sort)
      const res = await fetch(`/api/books?${params.toString()}`)
      if (!res.ok) {
        const json = (await res.json()) as { error: string }
        throw new Error(json.error ?? '알 수 없는 오류')
      }
      const json = (await res.json()) as { data: Book[]; error: null }
      setBooks(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [filters, sort, searchQuery])

  useEffect(() => {
    if (isInitialState) {
      setBooks(initialBooks)
      return
    }
    const t = setTimeout(() => { void loadBooks() }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, filters, sort, isInitialState, initialBooks, loadBooks])

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

  return {
    books, filters, setFilters, searchQuery, setSearchQuery,
    sort, setSort, viewMode, setViewMode, loading, error,
    categories, handleReset, loadBooks,
  }
}

// ── 하위 컴포넌트들 ────────────────────────────────────────────

function BookshelfHeader({ stats }: { stats: BookStats }) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        <p className="text-sm text-gray-500 mt-0.5">전체</p>
      </div>
      <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
        <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
        <p className="text-sm text-gray-500 mt-0.5">완독</p>
      </div>
      <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
        <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
        <p className="text-sm text-gray-500 mt-0.5">이번 달</p>
      </div>
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
  viewMode: 'gallery' | 'table'
  onViewModeChange: (v: 'gallery' | 'table') => void
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        <option value="read_end_desc">완독일 최신순</option>
        <option value="rating_desc">별점 높은순</option>
        <option value="created_at_asc">등록일 오래된순</option>
        <option value="title_asc">제목 가나다순</option>
      </select>
      <div className="flex gap-1">
        <button
          onClick={() => onViewModeChange('gallery')}
          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
            viewMode === 'gallery'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
          }`}
        >
          갤러리
        </button>
        <button
          onClick={() => onViewModeChange('table')}
          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
            viewMode === 'table'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
          }`}
        >
          표
        </button>
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
  viewMode: 'gallery' | 'table'
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

// ── 본체 ──────────────────────────────────────────────────────

export function BookshelfClient({ initialBooks, stats, allKeywords }: BookshelfClientProps) {
  const {
    books, filters, setFilters, searchQuery, setSearchQuery,
    sort, setSort, viewMode, setViewMode, loading, error,
    categories, handleReset, loadBooks,
  } = useBookshelf(initialBooks)

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-7xl mx-auto">
      <BookshelfHeader stats={stats} />
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
        onRetry={() => void loadBooks()}
      />
    </main>
  )
}

function BookSkeleton({ viewMode }: { viewMode: 'gallery' | 'table' }) {
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
