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

export interface BookPage {
  id: string
  bookId: string
  contentType: 'highlight' | 'memo' | 'ai_chat' | 'diary' | 'image'
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
  rating: string
  keywords: string[]
}
