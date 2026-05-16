/**
 * Notion → Supabase 마이그레이션 스크립트
 *
 * 실행 방법:
 *   npm run migrate
 *
 * 전제 조건:
 *   - .env.local 파일에 NOTION_API_KEY, NOTION_DATABASE_ID, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정
 *   - scripts/schema.sql 및 scripts/rls.sql 실행 완료
 *
 * ⚠️ Notion은 읽기 전용. 쓰기 작업 금지.
 */

// Node 20.6+ 내장 env 로더 사용 (dotenv 불필요)
try {
  process.loadEnvFile('.env.local')
} catch {
  // .env.local 없으면 환경변수가 이미 주입된 것으로 간주
}

import { notion, NOTION_DATABASE_ID } from '../lib/notion/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Supabase service role 클라이언트 (RLS bypass)
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface MigrationStats {
  booksProcessed: number
  booksInserted: number
  pagesInserted: number
  errors: string[]
}

async function migrateBooks(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    booksProcessed: 0,
    booksInserted: 0,
    pagesInserted: 0,
    errors: [],
  }

  console.log('[마이그레이션] 시작...')

  // 1. Supabase 스키마 확인
  const { error: schemaError } = await supabase
    .schema('book_memory')
    .from('books')
    .select('id')
    .limit(1)

  if (schemaError && schemaError.code !== 'PGRST116') {
    throw new Error(`Supabase 스키마 확인 실패: ${schemaError.message}`)
  }

  // 2. Notion DB 전체 페이지 조회 (페이지네이션)
  let hasMore = true
  let startCursor: string | undefined = undefined

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      start_cursor: startCursor,
      page_size: 100,
    })

    for (const page of response.results) {
      if (page.object !== 'page') continue
      stats.booksProcessed++

      try {
        // TODO: Notion 페이지 → books 매핑 (bookshelf.md §Notion 데이터 → DB 매핑 참고)
        // 현재는 skeleton — 실제 매핑 로직은 Notion 필드 확인 후 구현
        console.log(`[마이그레이션] 처리 중: ${page.id}`)

        // placeholder: 실제 구현 시 매핑 로직 추가
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        stats.errors.push(`페이지 ${page.id}: ${msg}`)
        console.error(`[마이그레이션] 오류 — 계속 진행: ${msg}`)
      }
    }

    hasMore = response.has_more
    startCursor = response.next_cursor ?? undefined
  }

  return stats
}

async function main() {
  try {
    const stats = await migrateBooks()

    console.log('\n[마이그레이션] 완료 보고')
    console.log(`처리된 책: ${stats.booksProcessed}`)
    console.log(`삽입된 books: ${stats.booksInserted}`)
    console.log(`삽입된 pages: ${stats.pagesInserted}`)

    if (stats.errors.length > 0) {
      console.error(`\n오류 (${stats.errors.length}건):`)
      stats.errors.forEach((e) => console.error(' -', e))
    }
  } catch (err) {
    console.error('[마이그레이션] 치명적 오류:', err)
    process.exit(1)
  }
}

main()
