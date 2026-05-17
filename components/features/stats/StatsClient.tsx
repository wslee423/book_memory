'use client'

import type { StatsData } from '@/types'

const KO_MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function heatColor(count: number): string {
  if (count === 0) return 'bg-gray-100 text-gray-300'
  if (count === 1) return 'bg-blue-100 text-blue-700'
  if (count === 2) return 'bg-blue-200 text-blue-800'
  if (count === 3) return 'bg-blue-300 text-blue-900'
  return 'bg-blue-500 text-white'
}

function MonthlyTable({ monthly }: { monthly: StatsData['monthly'] }) {
  if (monthly.length === 0) return <p className="text-sm text-gray-400">데이터가 없습니다.</p>

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
            <th className="text-left px-2 py-1.5 text-gray-500 font-medium w-14 shrink-0">년도</th>
            {KO_MONTHS.map((m) => (
              <th key={m} className="px-1 py-1.5 text-gray-500 font-medium text-center min-w-[2.5rem]">{m}</th>
            ))}
            <th className="px-2 py-1.5 text-gray-500 font-medium text-center">합계</th>
          </tr>
        </thead>
        <tbody>
          {years.map((year, yi) => (
            <tr key={year} className="border-t border-gray-100">
              <td className="px-2 py-2 font-semibold text-gray-700">{year}</td>
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
              <td className="px-2 py-2 text-center font-semibold text-gray-700">{yearTotals[yi]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OverviewCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-xl px-5 py-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-gray-600 w-6 text-right">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-700 mb-4">{title}</h2>
      {children}
    </section>
  )
}

export function StatsClient({ stats }: { stats: StatsData }) {
  const { overview, monthly, byCategory } = stats
  const maxCat = Math.max(...byCategory.map((c) => c.count), 1)

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">독서 통계</h1>

      {/* 개요 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <OverviewCard label="전체" value={overview.total} />
        <OverviewCard label="완독" value={overview.completed} />
        <OverviewCard label="읽는 중" value={overview.reading} />
        <OverviewCard label="평균 별점" value={overview.avgRating ?? '-'} />
      </div>

      <div className="flex flex-col gap-10">
        {/* 월별 독서량 히트맵 */}
        <Section title="월별 독서량">
          <MonthlyTable monthly={monthly} />
        </Section>

        {/* 분류별 독서 */}
        <Section title="분류별 독서">
          {byCategory.length === 0 ? (
            <p className="text-sm text-gray-400">데이터가 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {byCategory.map(({ category, count }) => (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0 truncate">{category}</span>
                  <Bar value={count} max={maxCat} color="bg-indigo-400" />
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </main>
  )
}
