'use client'

import type { FilterState } from '@/types'
import { STATUS_OPTIONS, RATING_OPTIONS } from '@/lib/constants/book'

interface BookFilterProps {
  filters: FilterState
  categories: string[]
  allKeywords: string[]
  onFilterChange: (filters: FilterState) => void
  onReset: () => void
}

const SELECT_CLASS =
  'border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500'

export function BookFilter({
  filters,
  categories,
  allKeywords,
  onFilterChange,
  onReset,
}: BookFilterProps) {
  const setField = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const toggleKeyword = (kw: string) => {
    const next = filters.keywords.includes(kw)
      ? filters.keywords.filter((k) => k !== kw)
      : [...filters.keywords, kw]
    setField('keywords', next)
  }

  const hasActiveFilter =
    filters.status !== '' ||
    filters.category !== '' ||
    filters.rating !== null ||
    filters.keywords.length > 0

  const ratingValue = filters.rating === null ? '' : String(filters.rating)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filters.status}
          onChange={(e) => setField('status', e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">전체 상태</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) => setField('category', e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">전체 분류</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={ratingValue}
          onChange={(e) => setField('rating', e.target.value === '' ? null : Number(e.target.value))}
          className={SELECT_CLASS}
        >
          <option value="">전체 별점</option>
          {RATING_OPTIONS.map((r) => (
            <option key={r} value={String(r)}>
              {'★'.repeat(r)} ({r}점)
            </option>
          ))}
        </select>

        {hasActiveFilter && (
          <button
            onClick={onReset}
            className="text-sm text-gray-500 dark:text-gray-400 underline hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            필터 초기화
          </button>
        )}
      </div>

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
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
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
