import { notFound } from 'next/navigation'
import { fetchBookById, fetchBookPages, fetchAdjacentBooks } from '@/lib/supabase/books'
import { BookDetailClient } from '@/components/bookshelf/BookDetailClient'

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const [book, pages, adjacent] = await Promise.all([
    fetchBookById(params.id),
    fetchBookPages(params.id),
    fetchAdjacentBooks(params.id),
  ])

  if (!book) notFound()

  return (
    <BookDetailClient
      book={book}
      pages={pages}
      prev={adjacent.prev}
      next={adjacent.next}
    />
  )
}
