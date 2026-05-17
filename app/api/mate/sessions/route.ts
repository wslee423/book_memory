import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import type { ChatSession } from '@/types'

interface RawSession {
  session_id: string
  content: string
  created_at: string
}

export async function GET() {
  const authResult = await requireUser()
  if (authResult.response) return authResult.response

  const supabase = await createClient()

  // 각 session_id의 첫 user 메시지를 제목으로, 마지막 메시지를 미리보기로 사용
  const { data, error } = await supabase
    .schema('book_memory')
    .from('chat_history')
    .select('session_id, content, created_at')
    .eq('role', 'user')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as RawSession[]
  const sessionMap = new Map<string, { title: string; lastMessage: string; createdAt: string }>()

  for (const row of rows) {
    if (!sessionMap.has(row.session_id)) {
      sessionMap.set(row.session_id, {
        title: row.content.slice(0, 40),
        lastMessage: row.content.slice(0, 60),
        createdAt: row.created_at,
      })
    } else {
      const existing = sessionMap.get(row.session_id)!
      existing.lastMessage = row.content.slice(0, 60)
    }
  }

  const sessions: ChatSession[] = Array.from(sessionMap.entries())
    .map(([id, meta]) => ({ id, ...meta }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ data: sessions, error: null })
}
