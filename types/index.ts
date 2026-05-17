export interface Book {
  id: string
  notionId: string | null
  title: string
  author: string | null
  category: string | null
  status: string | null
  rating: number | null
  keywords: string[]
  oneWord: string[]
  summary: string | null
  review: string | null
  coverUrl: string | null
  readStart: string | null
  readEnd: string | null
  notionAiUrl: string | null
  createdAt: string
  updatedAt: string
}

export type ContentType = 'highlight' | 'memo' | 'ai_chat' | 'diary' | 'image'

export interface BookPage {
  id: string
  bookId: string
  contentType: ContentType
  pageNumber: number | null
  content: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  sources: ChatSource[] | null
  createdAt: string
}

export interface ChatSource {
  bookId: string
  pageId: string | null
  bookTitle: string
  excerpt: string
}

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

export interface BookStats {
  total: number
  completed: number
  thisMonth: number
}

export interface FilterState {
  status: string
  category: string
  rating: number | null
  keywords: string[]
}

export type ViewMode = 'gallery' | 'table'

export interface EmbeddingRecord {
  id: string
  bookId: string
  pageId: string | null
  sourceType: 'book_meta' | 'page_content'
  content: string
  createdAt: string
}

export interface ChatSession {
  id: string
  title: string
  lastMessage: string
  createdAt: string
}

export type StreamChunk =
  | { type: 'sources'; sources: ChatSource[] }
  | { type: 'text'; text: string }
  | { type: 'error'; message: string }

export interface StatsData {
  monthly: { month: string; count: number }[]
  byCategory: { category: string; count: number }[]
  byRating: { rating: number; count: number }[]
  overview: { total: number; completed: number; reading: number; avgRating: number | null }
}

export interface TimelineBook {
  id: string
  title: string
  author: string | null
  category: string | null
  rating: number | null
  coverUrl: string | null
  readEnd: string
}

export interface TimelineMonth {
  month: string
  label: string
  books: TimelineBook[]
}
