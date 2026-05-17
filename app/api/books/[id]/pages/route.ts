import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/rag/embed'
import type { BookPage, ContentType } from '@/types'

interface AddPageBody {
  contentType: ContentType
  content: string
  pageNumber?: number | null
}

interface RawPage {
  id: string
  book_id: string
  content_type: string
  page_number: number | null
  content: string
  created_at: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireUser()
  if (authResult.response) return authResult.response

  const { id: bookId } = await params

  let body: AddPageBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: '요청 형식이 잘못되었습니다.' }, { status: 400 })
  }

  const { contentType, content, pageNumber } = body
  if (!content?.trim() || !contentType) {
    return NextResponse.json({ data: null, error: '내용과 유형이 필요합니다.' }, { status: 400 })
  }

  const supabase = await createClient()

  // book 존재 확인
  const { data: book, error: bookError } = await supabase
    .schema('book_memory')
    .from('books')
    .select('id')
    .eq('id', bookId)
    .single()

  if (bookError || !book) {
    return NextResponse.json({ data: null, error: '책을 찾을 수 없습니다.' }, { status: 404 })
  }

  // book_pages insert
  const { data: newPage, error: insertError } = await supabase
    .schema('book_memory')
    .from('book_pages')
    .insert({
      book_id: bookId,
      content_type: contentType,
      content: content.trim(),
      page_number: pageNumber ?? null,
    })
    .select()
    .single()

  if (insertError || !newPage) {
    return NextResponse.json({ data: null, error: '메모 저장에 실패했습니다.' }, { status: 500 })
  }

  const raw = newPage as RawPage

  // 임베딩 생성 (fire-and-forget — 실패해도 메모 저장은 성공)
  embedText(content.trim())
    .then((embedding) =>
      supabase.schema('book_memory').from('embeddings').insert({
        book_id: bookId,
        page_id: raw.id,
        source_type: 'page_content',
        content: content.trim(),
        embedding,
      }),
    )
    .catch(console.error)

  const page: BookPage = {
    id: raw.id,
    bookId: raw.book_id,
    contentType: raw.content_type as ContentType,
    pageNumber: raw.page_number,
    content: raw.content,
    createdAt: raw.created_at,
  }

  return NextResponse.json({ data: page, error: null }, { status: 201 })
}
