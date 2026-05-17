import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

type RequireUserResult =
  | { user: User; response: null }
  | { user: null; response: NextResponse }

export async function requireUser(): Promise<RequireUserResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { data: null, error: '인증이 필요합니다.' },
        { status: 401 },
      ),
    }
  }

  return { user, response: null }
}
