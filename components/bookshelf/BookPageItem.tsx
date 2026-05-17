'use client'

import { useState } from 'react'
import type { BookPage, ContentType } from '@/types'

interface BookPageItemProps {
  page: BookPage
  onUpdated: (updated: BookPage) => void
  onDeleted: (pageId: string) => void
}

const LEFT_BORDER: Record<Exclude<ContentType, 'image'>, string> = {
  highlight: 'border-l-4 border-yellow-400',
  memo:      'border-l-4 border-blue-400',
  ai_chat:   'border-l-4 border-gray-400',
  diary:     'border-l-4 border-green-400',
}

export function BookPageItem({ page, onUpdated, onDeleted }: BookPageItemProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(page.content)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (page.contentType === 'image') {
    return (
      <div className="rounded-lg overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={page.content} alt="책 페이지 이미지" className="max-w-full" />
      </div>
    )
  }

  const borderClass = LEFT_BORDER[page.contentType as Exclude<ContentType, 'image'>]

  async function handleSave() {
    if (!editContent.trim() || editContent === page.content) { setEditing(false); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/books/${page.bookId}/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })
      const json = await res.json()
      if (!res.ok || json.error) { setError(json.error ?? '수정 실패'); return }
      onUpdated(json.data)
      setEditing(false)
    } catch { setError('네트워크 오류가 발생했습니다.') }
    finally { setLoading(false) }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/books/${page.bookId}/pages/${page.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || json.error) { setError(json.error ?? '삭제 실패'); return }
      onDeleted(page.id)
    } catch { setError('네트워크 오류가 발생했습니다.') }
    finally { setLoading(false); setConfirmDelete(false) }
  }

  return (
    <div className={`group relative bg-white rounded-r-lg pl-4 pr-3 py-3 ${borderClass}`}>
      {/* 페이지 번호 */}
      {page.pageNumber != null && (
        <span className="text-xs text-gray-400 mr-2">p.{page.pageNumber}</span>
      )}

      {/* 호버 시 액션 버튼 */}
      {!editing && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setEditing(true); setEditContent(page.content) }}
            title="수정"
            className="p-1 text-gray-300 hover:text-blue-500 transition-colors text-xs"
          >
            ✏️
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              title="삭제"
              className="p-1 text-gray-300 hover:text-red-500 transition-colors text-xs"
            >
              🗑️
            </button>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-white border border-gray-200 rounded px-2 py-0.5 shadow-sm">
              <button onClick={handleDelete} disabled={loading} className="text-red-500 hover:text-red-700 font-medium">삭제</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setConfirmDelete(false)} className="text-gray-500 hover:text-gray-700">취소</button>
            </span>
          )}
        </div>
      )}

      {/* 본문 */}
      {editing ? (
        <div className="flex flex-col gap-2 mt-1">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setEditing(false); setError(null) }} className="text-sm text-gray-500 hover:text-gray-700">취소</button>
            <button
              onClick={handleSave}
              disabled={loading || !editContent.trim()}
              className="text-sm px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed pr-14">{page.content}</p>
      )}
    </div>
  )
}
