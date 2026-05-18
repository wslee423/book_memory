'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STATUS_OPTIONS } from '@/lib/constants/book'

const INPUT = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400'
const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  )
}

export function BookForm({ categories = [] }: { categories?: string[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [keywords, setKeywords] = useState('')
  const [summary, setSummary] = useState('')
  const [review, setReview] = useState('')
  const [readStart, setReadStart] = useState('')
  const [readEnd, setReadEnd] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('제목은 필수입니다.'); return }
    setLoading(true); setError(null)

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || undefined,
          category: category.trim() || undefined,
          status: status || undefined,
          rating,
          keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
          summary: summary.trim() || undefined,
          review: review.trim() || undefined,
          readStart: readStart || null,
          readEnd: readEnd || null,
          coverUrl: coverUrl.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) { setError(json.error ?? '등록 실패'); return }
      router.push(`/bookshelf/${json.data.id}`)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="제목 *">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="책 제목" className={INPUT} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="저자">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="저자명" className={INPUT} />
        </Field>
        <Field label="분류">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            list="new-category-list"
            placeholder="분류 선택 또는 직접 입력"
            className={INPUT}
          />
          <datalist id="new-category-list">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="읽기 상태">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={INPUT}>
            <option value="">선택 안 함</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="별점">
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? null : n)}
                className={`text-2xl transition-colors ${n <= (rating ?? 0) ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-700'} hover:text-yellow-300`}
              >
                ★
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="독서 시작일">
          <input type="date" value={readStart} onChange={(e) => setReadStart(e.target.value)} className={INPUT} />
        </Field>
        <Field label="독서 완료일">
          <input type="date" value={readEnd} onChange={(e) => setReadEnd(e.target.value)} className={INPUT} />
        </Field>
      </div>

      <Field label="키워드 (쉼표로 구분)">
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="예: 리더십, 성장, 철학" className={INPUT} />
      </Field>

      <Field label="한줄 요약">
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="이 책을 한 문장으로 요약하면?" className={INPUT} />
      </Field>

      <Field label="한줄 평">
        <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={2} placeholder="이 책을 읽고 한마디 한다면?" className={INPUT} />
      </Field>

      <Field label="표지 이미지 URL">
        <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." className={INPUT} />
      </Field>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? '등록 중...' : '책 등록'}
        </button>
      </div>
    </form>
  )
}
