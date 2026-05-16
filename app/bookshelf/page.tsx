import { createClient } from '@/lib/supabase/server'

export default async function BookshelfPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">나의 책장</h1>
      <p className="text-gray-500 mt-2">Phase 2에서 구현 예정</p>
      {user && (
        <p className="text-gray-400 text-sm mt-4">
          로그인된 계정: {user.email}
        </p>
      )}
    </main>
  )
}
