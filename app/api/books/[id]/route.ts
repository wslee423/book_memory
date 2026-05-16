import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchBookById, fetchBookPages } from '@/lib/supabase/books'
import type { ApiResponse, Book, BookPage } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<{ book: Book; pages: BookPage[] }>>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const book = await fetchBookById(params.id)

    if (!book) {
      return NextResponse.json(
        { data: null, error: '책을 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    const pages = await fetchBookPages(params.id)
    return NextResponse.json({ data: { book, pages }, error: null }, { status: 200 })
  } catch (err) {
    console.error('GET /api/books/[id] error:', err)
    return NextResponse.json({ data: null, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
