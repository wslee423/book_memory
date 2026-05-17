import { NextResponse } from 'next/server'
import { fetchBookById, fetchBookPages } from '@/lib/supabase/books'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/rag/embed'
import type { ApiResponse, Book, BookPage, BookStatus } from '@/types'

type DetailResponse = ApiResponse<{ book: Book; pages: BookPage[] }>

type RouteContext = { params: { id: string } }

interface RawBook {
  id: string
  notion_id: string | null
  title: string
  author: string | null
  category: string | null
  status: BookStatus | null
  rating: number | null
  keywords: string[]
  one_word: string[]
  summary: string | null
  review: string | null
  cover_url: string | null
  read_start: string | null
  read_end: string | null
  notion_ai_url: string | null
  created_at: string
  updated_at: string
}

function rawToBook(raw: RawBook): Book {
  return {
    id: raw.id,
    notionId: raw.notion_id,
    title: raw.title,
    author: raw.author,
    category: raw.category,
    status: raw.status,
    rating: raw.rating,
    keywords: raw.keywords ?? [],
    oneWord: raw.one_word ?? [],
    summary: raw.summary,
    review: raw.review,
    coverUrl: raw.cover_url,
    readStart: raw.read_start,
    readEnd: raw.read_end,
    notionAiUrl: raw.notion_ai_url,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
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

export async function PATCH(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<ApiResponse<Book>>> {
  const { user, response } = await requireUser()
  if (!user) return response as NextResponse<ApiResponse<Book>>

  let body: {
    title?: string
    author?: string | null
    category?: string | null
    status?: BookStatus | null
    rating?: number | null
    keywords?: string[]
    summary?: string | null
    review?: string | null
    readStart?: string | null
    readEnd?: string | null
    coverUrl?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: '요청 형식이 잘못되었습니다.' }, { status: 400 })
  }

  if (body.title !== undefined && !body.title?.trim()) {
    return NextResponse.json({ data: null, error: '제목은 필수입니다.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .schema('book_memory')
    .from('books')
    .update({
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.author !== undefined && { author: body.author || null }),
      ...(body.category !== undefined && { category: body.category || null }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.rating !== undefined && { rating: body.rating }),
      ...(body.keywords !== undefined && { keywords: body.keywords }),
      ...(body.summary !== undefined && { summary: body.summary || null }),
      ...(body.review !== undefined && { review: body.review || null }),
      ...(body.readStart !== undefined && { read_start: body.readStart || null }),
      ...(body.readEnd !== undefined && { read_end: body.readEnd || null }),
      ...(body.coverUrl !== undefined && { cover_url: body.coverUrl || null }),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ data: null, error: '수정에 실패했습니다.' }, { status: 500 })
  }

  const book = rawToBook(data as RawBook)

  // 메타 임베딩 재생성 (fire-and-forget)
  Promise.resolve()
    .then(async () => {
      const metaText = [book.title, book.author, book.category, book.summary, book.review, ...(book.keywords ?? [])].filter(Boolean).join(' ')
      const embedding = await embedText(metaText)
      await supabase.schema('book_memory').from('embeddings')
        .delete().eq('book_id', params.id).eq('source_type', 'book_meta')
      await supabase.schema('book_memory').from('embeddings').insert({
        book_id: params.id,
        page_id: null,
        source_type: 'book_meta',
        content: metaText,
        embedding,
      })
    })
    .catch(console.error)

  return NextResponse.json({ data: book, error: null })
}
