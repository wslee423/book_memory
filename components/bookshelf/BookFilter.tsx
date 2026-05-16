'use client'

import type { FilterState } from '@/types'

interface BookFilterProps {
  filters: FilterState
  categories: string[]
  allKeywords: string[]
  onFilterChange: (filters: FilterState) => void
  onReset: () => void
}

const STATUS_OPTIONS = [
  '완독',
  '읽는 중',
  '읽고 싶은 책',
  '완독 2회차',
  '중단',
  '소장',
  '서평완료',
  '속독',
  '상시',
]

const RATING_OPTIONS = [1, 2, 3, 4, 5]

export function BookFilter({
  filters,
  categories,
  allKeywords,
  onFilterChange,
  onReset,
}: BookFilterProps) {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value })
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, category: e.target.value })
  }

  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, rating: e.target.value })
  }

  const toggleKeyword = (kw: string) => {
    const next = filters.keywords.includes(kw)
      ? filters.keywords.filter((k) => k !== kw)
      : [...filters.keywords, kw]
    onFilterChange({ ...filters, keywords: next })
  }

  const hasActiveFilter =
    filters.status !== '' ||
    filters.category !== '' ||
    filters.rating !== '' ||
    filters.keywords.length > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center">
        {/* 상태 */}
        <select
          value={filters.status}
          onChange={handleStatusChange}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">전체 상태</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* 분류 */}
        <select
          value={filters.category}
          onChange={handleCategoryChange}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">전체 분류</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* 별점 */}
        <select
          value={filters.rating}
          onChange={handleRatingChange}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">전체 별점</option>
          {RATING_OPTIONS.map((r) => (
            <option key={r} value={String(r)}>
              {'★'.repeat(r)} ({r}점)
            </option>
          ))}
        </select>

        {/* 초기화 */}
        {hasActiveFilter && (
          <button
            onClick={onReset}
            className="text-sm text-gray-500 underline hover:text-gray-800 transition-colors"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 키워드 배지 */}
      {allKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allKeywords.map((kw) => {
            const active = filters.keywords.includes(kw)
            return (
              <button
                key={kw}
                onClick={() => toggleKeyword(kw)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  active
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {kw}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
