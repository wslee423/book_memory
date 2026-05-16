import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchBooks } from '@/lib/supabase/books'
import type { FetchBooksParams } from '@/lib/supabase/books'
import type { ApiResponse, Book } from '@/types'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Book[]>>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') ?? undefined
    const category = searchParams.get('category') ?? undefined
    const ratingParam = searchParams.get('rating')
    const rating = ratingParam ? Number(ratingParam) : undefined
    const keywordsParam = searchParams.get('keywords')
    const keywords = keywordsParam ? keywordsParam.split(',').filter(Boolean) : undefined
    const search = searchParams.get('search') ?? undefined
    const sortParam = searchParams.get('sort') ?? undefined

    const validSorts = ['read_end_desc', 'rating_desc', 'created_at_asc', 'title_asc'] as const
    type ValidSort = (typeof validSorts)[number]
    const sort: FetchBooksParams['sort'] =
      sortParam && (validSorts as readonly string[]).includes(sortParam)
        ? (sortParam as ValidSort)
        : undefined

    const books = await fetchBooks({ status, category, rating, keywords, search, sort })
    return NextResponse.json({ data: books, error: null }, { status: 200 })
  } catch (err) {
    console.error('GET /api/books error:', err)
    return NextResponse.json({ data: null, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
