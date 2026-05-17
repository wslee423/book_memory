import { NextResponse } from 'next/server'
import { fetchBooks } from '@/lib/supabase/books'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/rag/embed'
import { SORT_OPTIONS, type SortOption } from '@/lib/constants/book'
import type { ApiResponse, Book } from '@/types'

const VALID_SORTS: readonly string[] = SORT_OPTIONS.map((s) => s.value)

function parseSort(value: string | null): SortOption | undefined {
  if (value && VALID_SORTS.includes(value)) return value as SortOption
  return undefined
}

interface CreateBookBody {
  title: string
  author?: string
  category?: string
  status?: string
  rating?: number | null
  keywords?: string[]
  summary?: string
  review?: string
  readStart?: string | null
  readEnd?: string | null
  coverUrl?: string | null
}

interface RawBook {
  id: string
  notion_id: string | null
  title: string
  author: string | null
  category: string | null
  status: string | null
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

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Book>>> {
  const { user, response } = await requireUser()
  if (!user) return response as NextResponse<ApiResponse<Book>>

  let body: CreateBookBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: '요청 형식이 잘못되었습니다.' }, { status: 400 })
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ data: null, error: '제목은 필수입니다.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .schema('book_memory')
    .from('books')
    .insert({
      title: body.title.trim(),
      author: body.author?.trim() || null,
      category: body.category?.trim() || null,
      status: body.status || null,
      rating: body.rating ?? null,
      keywords: body.keywords ?? [],
      one_word: [],
      summary: body.summary?.trim() || null,
      review: body.review?.trim() || null,
      read_start: body.readStart || null,
      read_end: body.readEnd || null,
      cover_url: body.coverUrl?.trim() || null,
    })
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ data: null, error: '책 등록에 실패했습니다.' }, { status: 500 })
  }

  const raw = data as RawBook
  const book: Book = {
    id: raw.id,
    notionId: raw.notion_id,
    title: raw.title,
    author: raw.author,
    category: raw.category,
    status: raw.status,
    rating: raw.rating,
    keywords: raw.keywords,
    oneWord: raw.one_word,
    summary: raw.summary,
    review: raw.review,
    coverUrl: raw.cover_url,
    readStart: raw.read_start,
    readEnd: raw.read_end,
    notionAiUrl: raw.notion_ai_url,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }

  // 메타 임베딩 생성 (fire-and-forget)
  const metaText = [
    `제목: ${raw.title}`,
    raw.author ? `저자: ${raw.author}` : null,
    raw.keywords?.length ? `키워드: ${raw.keywords.join(', ')}` : null,
    raw.summary ? `요약: ${raw.summary}` : null,
  ].filter(Boolean).join('\n')

  embedText(metaText)
    .then((embedding) =>
      supabase.schema('book_memory').from('embeddings').insert({
        book_id: raw.id,
        page_id: null,
        source_type: 'book_meta',
        content: metaText,
        embedding,
      })
    )
    .catch(console.error)

  return NextResponse.json({ data: book, error: null }, { status: 201 })
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
