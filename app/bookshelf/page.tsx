import { fetchBooks, fetchBookStats, fetchAllKeywords } from '@/lib/supabase/books'
import { BookshelfClient } from '@/components/bookshelf/BookshelfClient'

export default async function BookshelfPage() {
  const [books, stats, keywords] = await Promise.all([
    fetchBooks({}),
    fetchBookStats(),
    fetchAllKeywords(),
  ])

  return <BookshelfClient initialBooks={books} stats={stats} allKeywords={keywords} />
}
