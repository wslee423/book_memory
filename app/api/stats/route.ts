import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { COMPLETED_STATUSES } from '@/lib/constants/book'
import type { BookStatus, StatsData } from '@/types'

interface RawBook {
  status: BookStatus | null
  rating: number | null
  category: string | null
  read_end: string | null
}

export async function GET() {
  const authResult = await requireUser()
  if (authResult.response) return authResult.response

  const supabase = await createClient()
  const { data, error } = await supabase
    .schema('book_memory')
    .from('books')
    .select('status, rating, category, read_end')

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

  const books = (data ?? []) as RawBook[]

  // 월별 독서량 (read_end 기준, 최근 24개월)
  const monthMap = new Map<string, number>()
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 23)

  for (const b of books) {
    if (!b.read_end) continue
    const d = new Date(b.read_end)
    if (d < cutoff) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1)
  }
  const monthly = Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // 분류 분포
  const catMap = new Map<string, number>()
  for (const b of books) {
    if (!b.category) continue
    catMap.set(b.category, (catMap.get(b.category) ?? 0) + 1)
  }
  const byCategory = Array.from(catMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  // 별점 분포
  const ratingMap = new Map<number, number>()
  for (const b of books) {
    if (!b.rating) continue
    ratingMap.set(b.rating, (ratingMap.get(b.rating) ?? 0) + 1)
  }
  const byRating = [1, 2, 3, 4, 5].map((r) => ({ rating: r, count: ratingMap.get(r) ?? 0 }))

  // 개요
  const completed = books.filter((b) => b.status != null && COMPLETED_STATUSES.includes(b.status)).length
  const reading = books.filter((b) => b.status === '읽는 중').length
  const rated = books.filter((b) => b.rating != null)
  const avgRating = rated.length > 0
    ? Math.round((rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length) * 10) / 10
    : null

  const statsData: StatsData = {
    monthly,
    byCategory,
    byRating,
    overview: { total: books.length, completed, reading, avgRating },
  }

  return NextResponse.json({ data: statsData, error: null })
}
