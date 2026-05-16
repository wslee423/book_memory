/**
 * Notion → Supabase 마이그레이션 스크립트
 *
 * 실행: npm run migrate
 *
 * 전제 조건:
 *   - .env.local 환경변수 설정 완료
 *   - scripts/schema.sql + scripts/rls.sql 실행 완료
 *   - Supabase Settings → API → Exposed schemas 에 book_memory 추가
 *   - Supabase Storage bucket 'book-media' (public) 생성 완료
 *
 * ⚠️ Notion은 읽기 전용. 이 스크립트는 Notion에 쓰지 않는다.
 */

try { process.loadEnvFile('.env.local') } catch { /* 환경변수 이미 주입됨 */ }

import { Client } from '@notionhq/client'
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ── 클라이언트 초기화 ──────────────────────────────────────────

const notion = new Client({ auth: process.env.NOTION_API_KEY })

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DB_ID = process.env.NOTION_DATABASE_ID ?? ''
const STORAGE_BUCKET = 'book-media'

// ── 타입 ──────────────────────────────────────────────────────

interface BookInsert {
  notion_id: string
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
}

interface PageInsert {
  book_id: string
  content_type: 'highlight' | 'memo' | 'ai_chat' | 'diary' | 'image'
  page_number: number | null
  content: string
}

interface MigrationStats {
  booksProcessed: number
  booksInserted: number
  pagesInserted: number
  imagesUploaded: number
  imagesFailed: number
  errors: string[]
}

// ── Notion 프로퍼티 파싱 헬퍼 ──────────────────────────────────

function getRichText(props: PageObjectResponse['properties'], key: string): string | null {
  const prop = props[key]
  if (!prop || prop.type !== 'rich_text') return null
  return prop.rich_text.map((r: RichTextItemResponse) => r.plain_text).join('').trim() || null
}

function getTitle(props: PageObjectResponse['properties'], key: string): string {
  const prop = props[key]
  if (!prop || prop.type !== 'title') return ''
  return prop.title.map((r: RichTextItemResponse) => r.plain_text).join('').trim()
}

function getSelect(props: PageObjectResponse['properties'], key: string): string | null {
  const prop = props[key]
  if (!prop || prop.type !== 'select') return null
  return prop.select?.name ?? null
}

function getMultiSelect(props: PageObjectResponse['properties'], key: string): string[] {
  const prop = props[key]
  if (!prop || prop.type !== 'multi_select') return []
  return prop.multi_select.map((s: { name: string }) => s.name)
}

function getUrl(props: PageObjectResponse['properties'], key: string): string | null {
  const prop = props[key]
  if (!prop || prop.type !== 'url') return null
  return prop.url ?? null
}

function getDateRange(
  props: PageObjectResponse['properties'],
  key: string
): { start: string | null; end: string | null } {
  const prop = props[key]
  if (!prop || prop.type !== 'date' || !prop.date) return { start: null, end: null }
  return { start: prop.date.start ?? null, end: prop.date.end ?? null }
}

function getCoverUrl(props: PageObjectResponse['properties'], key: string): string | null {
  const prop = props[key]
  if (!prop || prop.type !== 'files' || prop.files.length === 0) return null
  const first = prop.files[0]
  if (!first) return null
  if (first.type === 'file') return first.file.url
  if (first.type === 'external') return first.external.url
  return null
}

function parseRating(ratingStr: string | null): number | null {
  if (!ratingStr) return null
  const count = (ratingStr.match(/★/g) ?? []).length
  return count > 0 ? count : null
}

function parseBookPage(page: PageObjectResponse): BookInsert {
  const props = page.properties
  const dateRange = getDateRange(props, '읽은 기간')
  const dateRange2 = getDateRange(props, '읽은 기간 (1)')
  return {
    notion_id: page.id,
    title: getTitle(props, '이름'),
    author: getRichText(props, '저자'),
    category: getSelect(props, '분류'),
    status: getSelect(props, '상태'),
    rating: parseRating(getSelect(props, '별점')),
    keywords: getMultiSelect(props, '키워드'),
    one_word: getMultiSelect(props, '한단어감상'),
    summary: getRichText(props, '한줄 요약'),
    review: getRichText(props, '한 줄 평'),
    cover_url: getCoverUrl(props, '표지'),
    read_start: dateRange.start ?? dateRange2.start,
    read_end: dateRange.end ?? dateRange2.end ?? dateRange2.start,
    notion_ai_url: getUrl(props, 'AI 독서메이트'),
  }
}

// ── content_type 분류 ──────────────────────────────────────────

const PAGE_NUM_PATTERN = /^(\d+)p\s*/
const DIARY_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}/
const AI_CHAT_PATTERN = /블루|Gemini|gemini|Claude|claude/

function classifyBlock(
  block: BlockObjectResponse,
  plainText: string
): { type: 'highlight' | 'memo' | 'ai_chat' | 'diary'; pageNumber: number | null } {
  if (
    block.type === 'paragraph' &&
    (block.paragraph as { color?: string }).color === 'yellow_background'
  ) {
    return { type: 'highlight', pageNumber: null }
  }
  const pageMatch = PAGE_NUM_PATTERN.exec(plainText)
  if (pageMatch?.[1]) {
    return { type: 'memo', pageNumber: parseInt(pageMatch[1], 10) }
  }
  if (DIARY_DATE_PATTERN.test(plainText) && plainText.length >= 200) {
    return { type: 'diary', pageNumber: null }
  }
  if (AI_CHAT_PATTERN.test(plainText)) {
    return { type: 'ai_chat', pageNumber: null }
  }
  return { type: 'memo', pageNumber: null }
}

function extractPlainText(block: BlockObjectResponse): string {
  const richTextTypes = [
    'paragraph', 'heading_1', 'heading_2', 'heading_3',
    'bulleted_list_item', 'numbered_list_item', 'toggle', 'quote', 'callout',
  ] as const
  for (const bType of richTextTypes) {
    if (block.type === bType && bType in block) {
      const inner = (block as Record<string, unknown>)[bType] as { rich_text?: RichTextItemResponse[] }
      if (inner?.rich_text) {
        return inner.rich_text.map((r: RichTextItemResponse) => r.plain_text).join('').trim()
      }
    }
  }
  return ''
}

// ── Storage 이미지 업로드 ──────────────────────────────────────

function guessExtension(url: string, contentType: string | null): string {
  // content-type으로 먼저 판단
  if (contentType?.includes('png')) return 'png'
  if (contentType?.includes('gif')) return 'gif'
  if (contentType?.includes('webp')) return 'webp'
  // URL 경로에서 추출
  try {
    const pathname = new URL(url).pathname
    const ext = pathname.split('.').pop()?.toLowerCase()
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext
    }
  } catch { /* URL 파싱 실패 */ }
  return 'jpg'
}

async function uploadImageToStorage(
  notionUrl: string,
  storagePath: string
): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(notionUrl, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) throw new Error(`이미지 다운로드 실패: HTTP ${res.status}`)

    const contentType = res.headers.get('content-type')
    const buffer = await res.arrayBuffer()

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: contentType ?? 'image/jpeg',
        upsert: true,
      })

    if (error) throw new Error(`Storage 업로드 실패: ${error.message}`)

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath)

    return urlData.publicUrl
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`    ⚠️ 이미지 업로드 실패 (${storagePath}): ${msg}`)
    return null
  }
}

// ── Notion 블록 전체 조회 ──────────────────────────────────────

async function fetchAllBlocks(pageId: string): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = []
  let cursor: string | undefined
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    })
    blocks.push(...(res.results as BlockObjectResponse[]))
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)
  return blocks
}

// ── 메인 마이그레이션 ─────────────────────────────────────────

async function migrateBooks(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    booksProcessed: 0,
    booksInserted: 0,
    pagesInserted: 0,
    imagesUploaded: 0,
    imagesFailed: 0,
    errors: [],
  }

  console.log('[마이그레이션] 시작...\n')

  // Supabase 연결 확인
  const { error: schemaError } = await supabase
    .schema('book_memory').from('books').select('id').limit(1)
  if (schemaError && schemaError.code !== 'PGRST116') {
    throw new Error(`Supabase 연결 실패: ${schemaError.message}`)
  }
  console.log('✅ Supabase 연결 확인\n')

  // 전체 Notion 페이지 순회
  let hasMore = true
  let startCursor: string | undefined

  while (hasMore) {
    const res = await notion.databases.query({
      database_id: DB_ID,
      start_cursor: startCursor,
      page_size: 100,
    })

    for (const result of res.results) {
      if (result.object !== 'page') continue
      const page = result as PageObjectResponse
      stats.booksProcessed++

      try {
        const bookData = parseBookPage(page)
        if (!bookData.title) {
          console.warn(`  [건너뜀] ${page.id} — 제목 없음`)
          continue
        }

        // books upsert
        const { data: inserted, error: bookError } = await supabase
          .schema('book_memory')
          .from('books')
          .upsert(bookData, { onConflict: 'notion_id' })
          .select('id')
          .single()

        if (bookError || !inserted) {
          throw new Error(`books upsert 실패: ${bookError?.message}`)
        }
        stats.booksInserted++
        const bookId = inserted.id as string

        // 블록 파싱
        const blocks = await fetchAllBlocks(page.id)
        const pageInserts: PageInsert[] = []

        for (const block of blocks) {
          // 이미지 블록 처리
          if (block.type === 'image') {
            const imgBlock = block as BlockObjectResponse & {
              image: { type: string; file?: { url: string }; external?: { url: string } }
            }
            const notionUrl = imgBlock.image.type === 'file'
              ? (imgBlock.image.file?.url ?? '')
              : (imgBlock.image.external?.url ?? '')

            if (!notionUrl) continue

            const ext = guessExtension(notionUrl, null)
            const storagePath = `pages/${bookId}/${block.id}.${ext}`
            const publicUrl = await uploadImageToStorage(notionUrl, storagePath)

            if (publicUrl) {
              stats.imagesUploaded++
              pageInserts.push({
                book_id: bookId,
                content_type: 'image',
                page_number: null,
                content: publicUrl,
              })
            } else {
              stats.imagesFailed++
              // 실패 시 원본 Notion URL fallback
              pageInserts.push({
                book_id: bookId,
                content_type: 'image',
                page_number: null,
                content: notionUrl,
              })
            }
            continue
          }

          // 텍스트 블록 처리
          const plainText = extractPlainText(block)
          if (!plainText) continue

          const { type, pageNumber } = classifyBlock(block, plainText)
          const content = pageNumber !== null
            ? plainText.replace(PAGE_NUM_PATTERN, '').trim()
            : plainText

          if (!content) continue
          pageInserts.push({ book_id: bookId, content_type: type, page_number: pageNumber, content })
        }

        // book_pages 일괄 insert
        if (pageInserts.length > 0) {
          const { error: pagesError } = await supabase
            .schema('book_memory')
            .from('book_pages')
            .insert(pageInserts)
          if (pagesError) throw new Error(`book_pages insert 실패: ${pagesError.message}`)
          stats.pagesInserted += pageInserts.length
        }

        const imgCount = pageInserts.filter(p => p.content_type === 'image').length
        console.log(
          `  [${stats.booksProcessed}/129] ${bookData.title.substring(0, 28)}` +
          ` — pages: ${pageInserts.length - imgCount}, images: ${imgCount}`
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        stats.errors.push(`[${stats.booksProcessed}] ${page.id}: ${msg}`)
        console.error(`  ❌ 오류 (계속 진행): ${msg}`)
      }
    }

    hasMore = res.has_more
    startCursor = res.next_cursor ?? undefined
  }

  return stats
}

// ── 진입점 ────────────────────────────────────────────────────

async function main() {
  const start = Date.now()
  try {
    const stats = await migrateBooks()
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)

    console.log('\n══════════════════════════════════')
    console.log('[마이그레이션] 완료 보고')
    console.log(`  처리된 책:          ${stats.booksProcessed}`)
    console.log(`  삽입된 books:       ${stats.booksInserted}`)
    console.log(`  삽입된 book_pages:  ${stats.pagesInserted}`)
    console.log(`  업로드된 이미지:    ${stats.imagesUploaded}`)
    console.log(`  이미지 실패:        ${stats.imagesFailed}`)
    console.log(`  오류:               ${stats.errors.length}건`)
    console.log(`  소요 시간:          ${elapsed}초`)
    console.log('══════════════════════════════════')

    if (stats.errors.length > 0) {
      console.error('\n오류 목록:')
      stats.errors.forEach(e => console.error(' -', e))
      process.exit(1)
    }
  } catch (err) {
    console.error('\n[마이그레이션] 치명적 오류:', err)
    process.exit(1)
  }
}

main()
