'use client'

import type { StatsData } from '@/types'

interface BarProps { value: number; max: number; color: string }

function Bar({ value, max, color }: BarProps) {
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

function OverviewCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-xl px-5 py-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
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
  const { overview, monthly, byCategory, byRating } = stats

  const maxMonthly = Math.max(...monthly.map((m) => m.count), 1)
  const maxCat = Math.max(...byCategory.map((c) => c.count), 1)
  const maxRating = Math.max(...byRating.map((r) => r.count), 1)

  const RATING_LABELS: Record<number, string> = { 1: '★', 2: '★★', 3: '★★★', 4: '★★★★', 5: '★★★★★' }

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">독서 통계</h1>

      {/* 개요 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <OverviewCard label="전체" value={overview.total} />
        <OverviewCard label="완독" value={overview.completed} />
        <OverviewCard label="읽는 중" value={overview.reading} />
        <OverviewCard label="평균 별점" value={overview.avgRating ?? '-'} />
      </div>

      <div className="flex flex-col gap-10">
        {/* 월별 독서량 */}
        <Section title="월별 독서량">
          {monthly.length === 0 ? (
            <p className="text-sm text-gray-400">데이터가 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {monthly.map(({ month, count }) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16 shrink-0">{month}</span>
                  <Bar value={count} max={maxMonthly} color="bg-blue-400" />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* 분류 분포 */}
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

        {/* 별점 분포 */}
        <Section title="별점 분포">
          <div className="flex flex-col gap-2">
            {[...byRating].reverse().map(({ rating, count }) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-xs text-yellow-500 w-24 shrink-0">{RATING_LABELS[rating]}</span>
                <Bar value={count} max={maxRating} color="bg-yellow-400" />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </main>
  )
}
