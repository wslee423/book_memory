import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import type { TimelineBook, TimelineMonth } from '@/types'

interface RawBook {
  id: string
  title: string
  author: string | null
  category: string | null
  rating: number | null
  cover_url: string | null
  read_end: string
}

export async function GET() {
  const authResult = await requireUser()
  if (authResult.response) return authResult.response

  const supabase = await createClient()
  const { data, error } = await supabase
    .schema('book_memory')
    .from('books')
    .select('id, title, author, category, rating, cover_url, read_end')
    .not('read_end', 'is', null)
    .order('read_end', { ascending: false })

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

  const books = (data ?? []) as RawBook[]

  const monthMap = new Map<string, TimelineBook[]>()
  for (const b of books) {
    const d = new Date(b.read_end)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(key)) monthMap.set(key, [])
    monthMap.get(key)!.push({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      rating: b.rating,
      coverUrl: b.cover_url,
      readEnd: b.read_end,
    })
  }

  const KO_MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const timeline: TimelineMonth[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, books]) => {
      const [year, m] = month.split('-')
      return {
        month,
        label: `${year}년 ${KO_MONTHS[Number(m) - 1]}`,
        books,
      }
    })

  return NextResponse.json({ data: timeline, error: null })
}
