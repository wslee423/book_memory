/**
 * Notion API 클라이언트
 *
 * ⚠️ 마이그레이션 스크립트 전용 (scripts/migrate-notion.ts)
 * 앱 코드에서 직접 import 금지. Notion은 읽기 전용 소스다.
 */
import { Client } from '@notionhq/client'

if (!process.env.NOTION_API_KEY) {
  throw new Error('NOTION_API_KEY 환경변수가 설정되지 않았습니다.')
}

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID ?? ''
