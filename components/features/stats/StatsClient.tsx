'use client'

import type { StatsData, TimelineMonth } from '@/types'
import { TimelineSection } from './TimelineSection'

const KO_MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function heatColor(count: number): string {
  if (count === 0) return 'bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600'
  if (count === 1) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400'
  if (count === 2) return 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-300'
  if (count === 3) return 'bg-blue-300 text-blue-900 dark:bg-blue-700 dark:text-blue-200'
  return 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white'
}

function MonthlyTable({ monthly }: { monthly: StatsData['monthly'] }) {
  if (monthly.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">데이터가 없습니다.</p>
  }

  const lookup = new Map(monthly.map((m) => [m.month, m.count]))
  const years = Array.from(new Set(monthly.map((m) => m.month.slice(0, 4)))).sort()
  const yearTotals = years.map((y) =>
    Array.from({ length: 12 }, (_, i) => {
      const key = `${y}-${String(i + 1).padStart(2, '0')}`
      return lookup.get(key) ?? 0
    }).reduce((a, b) => a + b, 0),
  )

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr>
            <th className="text-left px-2 py-1.5 text-gray-500 dark:text-gray-400 font-medium w-14">년도</th>
            {KO_MONTHS.map((m) => (
              <th key={m} className="px-1 py-1.5 text-gray-500 dark:text-gray-400 font-medium text-center min-w-[2.5rem]">{m}</th>
            ))}
            <th className="px-2 py-1.5 text-gray-500 dark:text-gray-400 font-medium text-center">합계</th>
          </tr>
        </thead>
        <tbody>
          {years.map((year, yi) => (
            <tr key={year} className="border-t border-gray-100 dark:border-gray-800">
              <td className="px-2 py-2 font-semibold text-gray-700 dark:text-gray-300">{year}</td>
              {Array.from({ length: 12 }, (_, i) => {
                const key = `${year}-${String(i + 1).padStart(2, '0')}`
                const count = lookup.get(key) ?? 0
                return (
                  <td key={i} className="px-1 py-2 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-medium ${heatColor(count)}`}>
                      {count > 0 ? count : ''}
                    </span>
                  </td>
                )
              })}
              <td className="px-2 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">{yearTotals[yi]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CategoryGrid({ byCategory }: { byCategory: StatsData['byCategory'] }) {
  if (byCategory.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">데이터가 없습니다.</p>
  }

  const total = byCategory.reduce((sum, c) => sum + c.count, 0)
  const max = Math.max(...byCategory.map((c) => c.count), 1)

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {byCategory.map(({ category, count }) => (
        <div
          key={category}
          className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-3"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1" title={category}>{category}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {count}<span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-0.5">권</span>
          </p>
          <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 dark:bg-indigo-500 rounded-full"
              style={{ width: `${Math.round((count / max) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
            {Math.round((count / total) * 100)}%
          </p>
        </div>
      ))}
    </div>
  )
}

function OverviewCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl px-5 py-4 text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h2>
      {children}
    </section>
  )
}

interface StatsClientProps {
  stats: StatsData
  timeline: TimelineMonth[]
}

export function StatsClient({ stats, timeline }: StatsClientProps) {
  const { overview, monthly, byCategory } = stats

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">독서 통계</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <OverviewCard label="전체" value={overview.total} />
        <OverviewCard label="완독" value={overview.completed} />
        <OverviewCard label="읽는 중" value={overview.reading} />
        <OverviewCard label="평균 별점" value={overview.avgRating ?? '-'} />
      </div>

      <div className="flex flex-col gap-10">
        <Section title="월별 독서량">
          <MonthlyTable monthly={monthly} />
        </Section>

        <Section title="분류별 독서">
          <CategoryGrid byCategory={byCategory} />
        </Section>

        <Section title="독서 회고">
          <TimelineSection timeline={timeline} />
        </Section>
      </div>
    </main>
  )
}
