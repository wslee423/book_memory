import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatsClient } from '@/components/features/stats/StatsClient'
import type { StatsData } from '@/types'

interface RawBook {
  status: string | null
  rating: number | null
  category: string | null
  read_end: string | null
}

async function getStats(): Promise<StatsData> {
  const supabase = await createClient()
  const { data } = await supabase
    .schema('book_memory')
    .from('books')
    .select('status, rating, category, read_end')

  const books = (data ?? []) as RawBook[]

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

  const catMap = new Map<string, number>()
  for (const b of books) {
    if (!b.category) continue
    catMap.set(b.category, (catMap.get(b.category) ?? 0) + 1)
  }
  const byCategory = Array.from(catMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const ratingMap = new Map<number, number>()
  for (const b of books) {
    if (!b.rating) continue
    ratingMap.set(b.rating, (ratingMap.get(b.rating) ?? 0) + 1)
  }
  const byRating = [1, 2, 3, 4, 5].map((r) => ({ rating: r, count: ratingMap.get(r) ?? 0 }))

  const completed = books.filter((b) => b.status === '완독' || b.status === '읽음').length
  const reading = books.filter((b) => b.status === '읽는 중').length
  const rated = books.filter((b) => b.rating != null)
  const avgRating = rated.length > 0
    ? Math.round((rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length) * 10) / 10
    : null

  return { monthly, byCategory, byRating, overview: { total: books.length, completed, reading, avgRating } }
}

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stats = await getStats()
  return <StatsClient stats={stats} />
}
