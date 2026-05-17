import { createClient } from '@/lib/supabase/server'
import type { ChatSource } from '@/types'

interface RawSearchRow {
  id: string
  book_id: string
  page_id: string | null
  source_type: string
  content: string
  similarity: number
}

export interface SearchResult {
  id: string
  bookId: string
  pageId: string | null
  sourceType: 'book_meta' | 'page_content'
  content: string
  similarity: number
}

export async function searchSimilar(
  queryEmbedding: number[],
  matchCount = 10,
): Promise<SearchResult[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.schema('book_memory').rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  })
  if (error) throw new Error(`벡터 검색 실패: ${error.message}`)
  return ((data ?? []) as RawSearchRow[]).map((row) => ({
    id: row.id,
    bookId: row.book_id,
    pageId: row.page_id,
    sourceType: row.source_type as 'book_meta' | 'page_content',
    content: row.content,
    similarity: row.similarity,
  }))
}

interface RawBook {
  id: string
  title: string
  author: string | null
}

// top-N 검색 결과 → 중복 bookId 제거 후 ChatSource 변환
export async function buildSources(
  results: SearchResult[],
  topK = 5,
): Promise<ChatSource[]> {
  const supabase = await createClient()
  const topResults = results.slice(0, topK)
  const uniqueBookIds = Array.from(new Set(topResults.map((r) => r.bookId)))

  const { data: books } = await supabase
    .schema('book_memory')
    .from('books')
    .select('id, title, author')
    .in('id', uniqueBookIds)

  const bookMap = new Map<string, RawBook>(
    ((books ?? []) as RawBook[]).map((b) => [b.id, b]),
  )

  return topResults.map((r) => {
    const book = bookMap.get(r.bookId)
    return {
      bookId: r.bookId,
      pageId: r.pageId,
      bookTitle: book?.title ?? '알 수 없는 책',
      excerpt: r.content.slice(0, 120),
    }
  })
}
