'use client'

import { useState } from 'react'
import type { BookPage, ContentType } from '@/types'

interface MemoFormProps {
  bookId: string
  onSaved: (page: BookPage) => void
}

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'memo', label: '메모' },
  { value: 'highlight', label: '하이라이트' },
  { value: 'diary', label: '일기' },
]

export function MemoForm({ bookId, onSaved }: MemoFormProps) {
  const [open, setOpen] = useState(false)
  const [contentType, setContentType] = useState<ContentType>('memo')
  const [content, setContent] = useState('')
  const [pageNumber, setPageNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/books/${bookId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          content: content.trim(),
          pageNumber: pageNumber ? Number(pageNumber) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error ?? '저장에 실패했습니다.')
        return
      }
      onSaved(json.data)
      setContent('')
      setPageNumber('')
      setOpen(false)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 text-sm text-gray-400 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-500 transition-colors"
      >
        + 메모 추가
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-3">
      <div className="flex gap-2 items-center">
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value as ContentType)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
        >
          {CONTENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="number"
          value={pageNumber}
          onChange={(e) => setPageNumber(e.target.value)}
          placeholder="페이지 (선택)"
          min={1}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 bg-white"
        />
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요..."
        rows={4}
        className="border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
