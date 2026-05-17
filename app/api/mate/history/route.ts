import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import type { ChatMessage, ChatSource } from '@/types'

interface RawHistory {
  id: string
  session_id: string
  role: string
  content: string
  sources: ChatSource[] | null
  created_at: string
}

export async function GET(request: Request) {
  const authResult = await requireUser()
  if (authResult.response) return authResult.response

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ data: null, error: '세션 ID가 필요합니다.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .schema('book_memory')
    .from('chat_history')
    .select('id, session_id, role, content, sources, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  const messages: ChatMessage[] = ((data ?? []) as RawHistory[]).map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    role: row.role as 'user' | 'assistant',
    content: row.content,
    sources: row.sources,
    createdAt: row.created_at,
  }))

  return NextResponse.json({ data: messages, error: null })
}
