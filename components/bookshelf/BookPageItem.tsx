import type { BookPage } from '@/types'

interface BookPageItemProps {
  page: BookPage
}

export function BookPageItem({ page }: BookPageItemProps) {
  const { contentType, pageNumber, content } = page

  if (contentType === 'image') {
    return (
      <div className="my-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content} alt="책 페이지 이미지" className="max-w-full rounded" />
      </div>
    )
  }

  if (contentType === 'highlight') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded my-2">
        <p className="whitespace-pre-wrap text-gray-800">{content}</p>
      </div>
    )
  }

  if (contentType === 'memo') {
    return (
      <div className="my-2">
        {pageNumber != null && (
          <span className="bg-gray-100 text-xs px-2 py-0.5 rounded mr-2">
            p{pageNumber}
          </span>
        )}
        <span className="whitespace-pre-wrap text-gray-700">{content}</span>
      </div>
    )
  }

  if (contentType === 'ai_chat') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3 my-2">
        <p className="whitespace-pre-wrap text-gray-700">{content}</p>
      </div>
    )
  }

  if (contentType === 'diary') {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 px-4 py-3 rounded my-2">
        <p className="whitespace-pre-wrap text-gray-800">{content}</p>
      </div>
    )
  }

  return (
    <div className="my-2">
      <p className="whitespace-pre-wrap text-gray-700">{content}</p>
    </div>
  )
}
