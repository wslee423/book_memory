/**
 * 메모 병합 스크립트
 *
 * 같은 책, 같은 유형(content_type)의 연속된 book_pages를 하나로 합칩니다.
 * Notion 마이그레이션 시 한 줄씩 분리된 항목들을 정리하기 위한 1회성 스크립트.
 *
 * 사용법:
 *   npm run merge-pages          → 프리뷰만 (실제 변경 없음)
 *   npm run merge-pages execute  → 실제 병합 실행
 *
 * 병합 기준:
 *   - 같은 book_id + 같은 content_type
 *   - created_at 순으로 정렬했을 때 연속된 항목
 *   - image 타입은 제외 (이미지는 개별 유지)
 */

try { process.loadEnvFile('.env.local') } catch { /* 환경변수 이미 주입됨 */ }

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const EXECUTE = process.argv[2] === 'execute'

interface RawPage {
  id: string
  book_id: string
  content_type: string
  page_number: number | null
  content: string
  created_at: string
}

interface MergeGroup {
  bookId: string
  contentType: string
  pages: RawPage[]
  mergedContent: string
}

async function main() {
  console.log(EXECUTE ? '=== 병합 실행 ===' : '=== 프리뷰 (변경 없음) ===')
  console.log()

  // 전체 book_pages 조회 (image 제외)
  const { data, error } = await supabase
    .schema('book_memory')
    .from('book_pages')
    .select('id, book_id, content_type, page_number, content, created_at')
    .neq('content_type', 'image')
    .order('book_id')
    .order('content_type')
    .order('created_at')

  if (error) throw new Error(error.message)
  const pages = (data ?? []) as RawPage[]

  // 책+유형별로 그룹화 후 연속 항목 탐지
  const mergeGroups: MergeGroup[] = []
  let i = 0

  while (i < pages.length) {
    const current = pages[i]!
    const group: RawPage[] = [current]

    // 같은 book_id + content_type이 연속되는 동안 묶음
    let j = i + 1
    while (
      j < pages.length &&
      pages[j]!.book_id === current.book_id &&
      pages[j]!.content_type === current.content_type
    ) {
      group.push(pages[j]!)
      j++
    }

    // 2개 이상이면 병합 대상
    if (group.length > 1) {
      mergeGroups.push({
        bookId: current.book_id,
        contentType: current.content_type,
        pages: group,
        mergedContent: group.map((p) => p.content).join('\n\n'),
      })
    }

    i = j
  }

  if (mergeGroups.length === 0) {
    console.log('병합할 항목이 없습니다.')
    return
  }

  // 책 제목 조회
  const bookIds = Array.from(new Set(mergeGroups.map((g) => g.bookId)))
  const { data: books } = await supabase
    .schema('book_memory')
    .from('books')
    .select('id, title')
    .in('id', bookIds)
  const bookMap = new Map(((books ?? []) as { id: string; title: string }[]).map((b) => [b.id, b.title]))

  let totalBefore = 0
  let totalAfter = 0

  for (const group of mergeGroups) {
    totalBefore += group.pages.length
    totalAfter += 1
  }

  if (!EXECUTE) {
    // 프리뷰: 파일로 저장
    const lines: string[] = []
    lines.push(`병합 프리뷰 — 총 ${totalBefore}개 → ${totalAfter}개 (${totalBefore - totalAfter}개 감소)`)
    lines.push(`실행하려면: npm run merge-pages execute`)
    lines.push('='.repeat(80))
    lines.push('')

    for (const group of mergeGroups) {
      const title = bookMap.get(group.bookId) ?? group.bookId
      const typeLabel: Record<string, string> = {
        highlight: '하이라이트', memo: '메모', ai_chat: 'AI 대화', diary: '일기',
      }
      lines.push(`📚 ${title}  [${typeLabel[group.contentType] ?? group.contentType}]  ${group.pages.length}개 → 1개`)
      lines.push('-'.repeat(60))
      lines.push('[ 병합 전 각 항목 ]')
      group.pages.forEach((p, idx) => {
        lines.push(`\n  [${idx + 1}/${group.pages.length}]${p.page_number != null ? ` p.${p.page_number}` : ''}`)
        lines.push(p.content.split('\n').map((l) => `  ${l}`).join('\n'))
      })
      lines.push('')
      lines.push('[ 병합 후 ]')
      lines.push(group.mergedContent.split('\n').map((l) => `  ${l}`).join('\n'))
      lines.push('')
      lines.push('='.repeat(80))
      lines.push('')
    }

    const outPath = path.resolve('merge-preview.txt')
    fs.writeFileSync(outPath, lines.join('\n'), 'utf-8')
    console.log(`프리뷰 파일 저장: ${outPath}`)
    console.log(`총 ${totalBefore}개 → ${totalAfter}개 (${totalBefore - totalAfter}개 감소)`)
    console.log('\n파일을 열어 내용을 확인하세요.')
    console.log('실제 병합하려면: npm run merge-pages execute')
    return
  }

  // 실행: 첫 번째 항목을 병합 내용으로 update, 나머지 delete
  let successCount = 0
  let errorCount = 0

  for (const group of mergeGroups) {
    const [keep, ...remove] = group.pages
    const removeIds = remove.map((p) => p.id)

    try {
      // 첫 항목 내용 업데이트
      const { error: updateErr } = await supabase
        .schema('book_memory')
        .from('book_pages')
        .update({ content: group.mergedContent })
        .eq('id', keep!.id)

      if (updateErr) throw updateErr

      // 나머지 항목 삭제
      const { error: deleteErr } = await supabase
        .schema('book_memory')
        .from('book_pages')
        .delete()
        .in('id', removeIds)

      if (deleteErr) throw deleteErr

      // 삭제된 항목의 임베딩도 제거
      await supabase
        .schema('book_memory')
        .from('embeddings')
        .delete()
        .in('page_id', removeIds)

      // 남은 항목의 임베딩도 삭제 (내용이 바뀌었으므로 — 재임베딩은 npm run embed로)
      await supabase
        .schema('book_memory')
        .from('embeddings')
        .delete()
        .eq('page_id', keep!.id)

      successCount++
    } catch (err) {
      console.error(`오류: ${group.bookId} [${group.contentType}]`, err)
      errorCount++
    }
  }

  console.log(`\n=== 완료 ===`)
  console.log(`성공: ${successCount}건, 오류: ${errorCount}건`)
  console.log('\n임베딩이 초기화되었습니다. 병합 완료 후 npm run embed 를 다시 실행하세요.')
}

main().catch((err) => {
  console.error('치명적 오류:', err)
  process.exit(1)
})
