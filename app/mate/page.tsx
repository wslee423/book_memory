import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MateClient } from '@/components/features/mate/MateClient'
import type { ChatSession } from '@/types'

interface RawSession {
  session_id: string
  content: string
  created_at: string
}

async function getSessions(): Promise<ChatSession[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .schema('book_memory')
    .from('chat_history')
    .select('session_id, content, created_at')
    .eq('role', 'user')
    .order('created_at', { ascending: true })

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
      sessionMap.get(row.session_id)!.lastMessage = row.content.slice(0, 60)
    }
  }

  return Array.from(sessionMap.entries())
    .map(([id, meta]) => ({ id, ...meta }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export default async function MatePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const sessions = await getSessions()

  return <MateClient initialSessions={sessions} />
}
