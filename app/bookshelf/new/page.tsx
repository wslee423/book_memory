import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fetchAllCategories } from '@/lib/supabase/books'
import { BookForm } from '@/components/bookshelf/BookForm'

export default async function NewBookPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const categories = await fetchAllCategories()

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-2xl mx-auto">
      <Link
        href="/bookshelf"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        ← 책장으로 돌아가기
      </Link>
      <h1 className="text-xl font-bold text-gray-900 mb-6">새 책 등록</h1>
      <BookForm categories={categories} />
    </main>
  )
}
