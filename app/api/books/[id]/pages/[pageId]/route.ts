import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/rag/embed'
import type { BookPage, ContentType } from '@/types'

interface RawPage {
  id: string
  book_id: string
  content_type: string
  page_number: number | null
  content: string
  created_at: string
}

type RouteContext = { params: Promise<{ id: string; pageId: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const authResult = await requireUser()
  if (authResult.response) return authResult.response

  const { id: bookId, pageId } = await params

  let body: { content: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: '요청 형식이 잘못되었습니다.' }, { status: 400 })
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ data: null, error: '내용이 필요합니다.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .schema('book_memory')
    .from('book_pages')
    .update({ content: body.content.trim() })
    .eq('id', pageId)
    .eq('book_id', bookId)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ data: null, error: '수정에 실패했습니다.' }, { status: 500 })
  }

  const raw = data as RawPage

  // 새 임베딩 생성 성공 후 기존 삭제 — 실패 시 기존 임베딩 보존
  Promise.resolve()
    .then(async () => {
      const embedding = await embedText(body.content.trim())
      await supabase.schema('book_memory').from('embeddings').delete().eq('page_id', pageId)
      await supabase.schema('book_memory').from('embeddings').insert({
        book_id: bookId,
        page_id: pageId,
        source_type: 'page_content',
        content: body.content.trim(),
        embedding,
      })
    })
    .catch(console.error)

  const page: BookPage = {
    id: raw.id,
    bookId: raw.book_id,
    contentType: raw.content_type as ContentType,
    pageNumber: raw.page_number,
    content: raw.content,
    createdAt: raw.created_at,
  }

  return NextResponse.json({ data: page, error: null })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const authResult = await requireUser()
  if (authResult.response) return authResult.response

  const { id: bookId, pageId } = await params

  const supabase = await createClient()
  const { error } = await supabase
    .schema('book_memory')
    .from('book_pages')
    .delete()
    .eq('id', pageId)
    .eq('book_id', bookId)

  if (error) {
    return NextResponse.json({ data: null, error: '삭제에 실패했습니다.' }, { status: 500 })
  }

  // 임베딩도 삭제 (cascade가 없으므로 명시적 삭제)
  void supabase.schema('book_memory').from('embeddings').delete().eq('page_id', pageId)

  return NextResponse.json({ data: { id: pageId }, error: null })
}
