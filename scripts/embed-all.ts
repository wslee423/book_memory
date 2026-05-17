/**
 * 배치 임베딩 스크립트 — 터미널에서 직접 실행
 * npm run embed
 *
 * book_pages 전체 + 책 메타데이터를 임베딩하여 embeddings 테이블에 저장.
 * 이미지 페이지는 Claude Vision으로 텍스트 추출 후 임베딩.
 * 이미 임베딩된 page_id는 건너뜀 (upsert 방식).
 */

try { process.loadEnvFile('.env.local') } catch { /* 환경변수 이미 주입됨 */ }

import { createClient } from '@supabase/supabase-js'
import { embedText, extractImageText, chunkText } from '../lib/rag/embed'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface RawBook {
  id: string
  title: string
  author: string | null
  keywords: string[] | null
  summary: string | null
}

interface RawPage {
  id: string
  book_id: string
  content_type: string
  content: string
}

async function getEmbeddedPageIds(): Promise<Set<string>> {
  const { data } = await supabase
    .schema('book_memory')
    .from('embeddings')
    .select('page_id')
    .not('page_id', 'is', null)
  return new Set(((data ?? []) as { page_id: string }[]).map((r) => r.page_id))
}

async function getEmbeddedBookMetaIds(): Promise<Set<string>> {
  const { data } = await supabase
    .schema('book_memory')
    .from('embeddings')
    .select('book_id')
    .eq('source_type', 'book_meta')
  return new Set(((data ?? []) as { book_id: string }[]).map((r) => r.book_id))
}

async function insertEmbedding(row: {
  book_id: string
  page_id: string | null
  source_type: 'book_meta' | 'page_content'
  content: string
  embedding: number[]
}) {
  const { error } = await supabase.schema('book_memory').from('embeddings').insert(row)
  if (error) throw new Error(`임베딩 저장 실패: ${error.message}`)
}

async function embedBook(book: RawBook) {
  const metaText = [
    `제목: ${book.title}`,
    book.author ? `저자: ${book.author}` : null,
    book.keywords?.length ? `키워드: ${book.keywords.join(', ')}` : null,
    book.summary ? `요약: ${book.summary}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const embedding = await embedText(metaText)
  await insertEmbedding({
    book_id: book.id,
    page_id: null,
    source_type: 'book_meta',
    content: metaText,
    embedding,
  })
}

async function embedPage(page: RawPage) {
  let text = page.content

  if (page.content_type === 'image') {
    console.log(`  [vision] 이미지 텍스트 추출: ${page.id}`)
    text = await extractImageText(page.content)
    if (!text.trim()) {
      console.log(`  [skip] 이미지 텍스트 없음: ${page.id}`)
      return
    }
  }

  const chunks = chunkText(text)
  for (const chunk of chunks) {
    const embedding = await embedText(chunk)
    await insertEmbedding({
      book_id: page.book_id,
      page_id: page.id,
      source_type: 'page_content',
      content: chunk,
      embedding,
    })
  }
}

async function main() {
  console.log('=== 배치 임베딩 시작 ===')

  const [embeddedPageIds, embeddedMetaIds] = await Promise.all([
    getEmbeddedPageIds(),
    getEmbeddedBookMetaIds(),
  ])

  console.log(`기존 임베딩: 메타 ${embeddedMetaIds.size}건, 페이지 ${embeddedPageIds.size}건`)

  // 책 목록 조회
  const { data: books, error: booksError } = await supabase
    .schema('book_memory')
    .from('books')
    .select('id, title, author, keywords, summary')
  if (booksError) throw new Error(booksError.message)
  const bookList = (books ?? []) as RawBook[]

  let metaCount = 0
  let pageCount = 0
  let errorCount = 0

  for (const book of bookList) {
    try {
      // 책 메타 임베딩
      if (!embeddedMetaIds.has(book.id)) {
        await embedBook(book)
        metaCount++
        console.log(`[meta] ${book.title}`)
      }

      // 페이지 임베딩
      const { data: pages, error: pagesError } = await supabase
        .schema('book_memory')
        .from('book_pages')
        .select('id, book_id, content_type, content')
        .eq('book_id', book.id)
      if (pagesError) throw new Error(pagesError.message)

      for (const page of (pages ?? []) as RawPage[]) {
        if (embeddedPageIds.has(page.id)) continue
        try {
          await embedPage(page)
          pageCount++
        } catch (err) {
          console.error(`  [error] page ${page.id}:`, err)
          errorCount++
        }
        // 이미지(Vision)는 토큰 소모가 많아 딜레이를 더 줌
        const delay = page.content_type === 'image' ? 800 : 50
        await new Promise((r) => setTimeout(r, delay))
      }
    } catch (err) {
      console.error(`[error] book ${book.title}:`, err)
      errorCount++
    }
  }

  console.log(`\n=== 완료 ===`)
  console.log(`메타 임베딩: ${metaCount}건`)
  console.log(`페이지 임베딩: ${pageCount}건`)
  console.log(`에러: ${errorCount}건`)
}

main().catch((err) => {
  console.error('치명적 오류:', err)
  process.exit(1)
})
