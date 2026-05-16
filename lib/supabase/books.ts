import { createClient } from '@/lib/supabase/server'
import type { Book, BookPage, BookStats } from '@/types'

export interface FetchBooksParams {
  status?: string
  category?: string
  rating?: number
  keywords?: string[]
  search?: string
  sort?: 'read_end_desc' | 'rating_desc' | 'created_at_asc' | 'title_asc'
}

interface RawBook {
  id: string
  notion_id: string | null
  title: string
  author: string | null
  category: string | null
  status: string | null
  rating: number | null
  keywords: string[] | null
  one_word: string[] | null
  summary: string | null
  review: string | null
  cover_url: string | null
  read_start: string | null
  read_end: string | null
  notion_ai_url: string | null
  created_at: string
  updated_at: string
}

interface RawBookPage {
  id: string
  book_id: string
  content_type: 'highlight' | 'memo' | 'ai_chat' | 'diary' | 'image'
  page_number: number | null
  content: string
  created_at: string
}

function toBook(raw: RawBook): Book {
  return {
    id: raw.id,
    notionId: raw.notion_id,
    title: raw.title,
    author: raw.author,
    category: raw.category,
    status: raw.status,
    rating: raw.rating,
    keywords: raw.keywords ?? [],
    oneWord: raw.one_word ?? [],
    summary: raw.summary,
    review: raw.review,
    coverUrl: raw.cover_url,
    readStart: raw.read_start,
    readEnd: raw.read_end,
    notionAiUrl: raw.notion_ai_url,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function toBookPage(raw: RawBookPage): BookPage {
  return {
    id: raw.id,
    bookId: raw.book_id,
    contentType: raw.content_type,
    pageNumber: raw.page_number,
    content: raw.content,
    createdAt: raw.created_at,
  }
}

type SortOption = FetchBooksParams['sort']

export async function fetchBooks(params: FetchBooksParams): Promise<Book[]> {
  const supabase = await createClient()
  const { status, category, rating, keywords, search, sort } = params

  let query = supabase.schema('book_memory').from('books').select('*')

  if (status) query = query.eq('status', status)
  if (category) query = query.eq('category', category)
  if (rating !== undefined) query = query.eq('rating', rating)
  if (keywords && keywords.length > 0) query = query.overlaps('keywords', keywords)
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,author.ilike.%${search}%,summary.ilike.%${search}%,review.ilike.%${search}%`,
    )
  }

  query = applySortToQuery(query, sort)

  const { data, error } = await query
  if (error) {
    console.error('fetchBooks error:', error)
    return []
  }
  return (data as RawBook[]).map(toBook)
}

function applySortToQuery(
  query: ReturnType<ReturnType<ReturnType<Awaited<ReturnType<typeof createClient>>['schema']>['from']>['select']>,
  sort: SortOption,
) {
  switch (sort) {
    case 'rating_desc':
      return query.order('rating', { ascending: false, nullsFirst: false })
    case 'created_at_asc':
      return query.order('created_at', { ascending: true })
    case 'title_asc':
      return query.order('title', { ascending: true })
    case 'read_end_desc':
    default:
      return query.order('read_end', { ascending: false, nullsFirst: false })
  }
}

export async function fetchBookById(id: string): Promise<Book | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .schema('book_memory')
    .from('books')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null  // not found, intentional
    console.error('[book_memory] fetchBookById error:', error)
    return null
  }
  return data ? toBook(data as RawBook) : null
}

export async function fetchBookPages(bookId: string): Promise<BookPage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .schema('book_memory')
    .from('book_pages')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: true })

  if (error || !data) {
    console.error('fetchBookPages error:', error)
    return []
  }

  return (data as RawBookPage[]).map(toBookPage)
}

export async function fetchBookStats(): Promise<BookStats> {
  const supabase = await createClient()

  const { data: allBooks, error } = await supabase
    .schema('book_memory')
    .from('books')
    .select('status, read_end')

  if (error || !allBooks) {
    console.error('fetchBookStats error:', error)
    return { total: 0, completed: 0, thisMonth: 0 }
  }

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]!

  const total = allBooks.length
  const completed = allBooks.filter(
    (b) => b.status === '완독' || b.status === '완독 2회차' || b.status === '서평완료',
  ).length
  const thisMonth = allBooks.filter((b) => {
    if (!b.read_end) return false
    return b.read_end >= thisMonthStart
  }).length

  return { total, completed, thisMonth }
}

export async function fetchAdjacentBooks(
  id: string,
): Promise<{ prev: { id: string; title: string } | null; next: { id: string; title: string } | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .schema('book_memory')
    .from('books')
    .select('id, title, read_end')
    .order('read_end', { ascending: false, nullsFirst: false })

  if (error || !data) {
    console.error('[book_memory] fetchAdjacentBooks error:', error)
    return { prev: null, next: null }
  }

  const list = data as { id: string; title: string; read_end: string | null }[]
  const idx = list.findIndex((b) => b.id === id)
  if (idx === -1) return { prev: null, next: null }

  const prevBook = idx > 0 ? list[idx - 1] : null
  const nextBook = idx < list.length - 1 ? list[idx + 1] : null

  return {
    prev: prevBook ? { id: prevBook.id, title: prevBook.title } : null,
    next: nextBook ? { id: nextBook.id, title: nextBook.title } : null,
  }
}

export async function fetchAllKeywords(): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .schema('book_memory')
    .from('books')
    .select('keywords')

  if (error || !data) {
    console.error('fetchAllKeywords error:', error)
    return []
  }

  const keywordSet = new Set<string>()
  for (const row of data as { keywords: string[] | null }[]) {
    if (row.keywords) {
      for (const kw of row.keywords) {
        if (kw) keywordSet.add(kw)
      }
    }
  }

  return Array.from(keywordSet).sort()
}
