import { NextResponse } from 'next/server'
import { fetchBooks } from '@/lib/supabase/books'
import { requireUser } from '@/lib/auth/require-user'
import { SORT_OPTIONS, type SortOption } from '@/lib/constants/book'
import type { ApiResponse, Book } from '@/types'

const VALID_SORTS: readonly string[] = SORT_OPTIONS.map((s) => s.value)

function parseSort(value: string | null): SortOption | undefined {
  if (value && VALID_SORTS.includes(value)) return value as SortOption
  return undefined
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Book[]>>> {
  const { user, response } = await requireUser()
  if (!user) return response as NextResponse<ApiResponse<Book[]>>

  try {
    const { searchParams } = new URL(request.url)
    const ratingParam = searchParams.get('rating')
    const keywordsParam = searchParams.get('keywords')

    const books = await fetchBooks({
      status: searchParams.get('status') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      rating: ratingParam ? Number(ratingParam) : undefined,
      keywords: keywordsParam ? keywordsParam.split(',').filter(Boolean) : undefined,
      search: searchParams.get('search') ?? undefined,
      sort: parseSort(searchParams.get('sort')),
    })
    return NextResponse.json({ data: books, error: null }, { status: 200 })
  } catch (err) {
    console.error('GET /api/books error:', err)
    return NextResponse.json({ data: null, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
