import { NextResponse } from 'next/server'
import { fetchBookById, fetchBookPages } from '@/lib/supabase/books'
import { requireUser } from '@/lib/auth/require-user'
import type { ApiResponse, Book, BookPage } from '@/types'

type DetailResponse = ApiResponse<{ book: Book; pages: BookPage[] }>

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse<DetailResponse>> {
  const { user, response } = await requireUser()
  if (!user) return response as NextResponse<DetailResponse>

  try {
    const [book, pages] = await Promise.all([
      fetchBookById(params.id),
      fetchBookPages(params.id),
    ])

    if (!book) {
      return NextResponse.json(
        { data: null, error: '책을 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: { book, pages }, error: null }, { status: 200 })
  } catch (err) {
    console.error('GET /api/books/[id] error:', err)
    return NextResponse.json({ data: null, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
