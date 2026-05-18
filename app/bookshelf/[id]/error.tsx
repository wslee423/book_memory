'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[bookshelf] 페이지 오류:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 p-8 max-w-5xl mx-auto">
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">책을 불러오지 못했습니다.</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          잠시 후 다시 시도해주세요. 문제가 계속되면 새로고침해주세요.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
          >
            다시 시도
          </button>
          <Link
            href="/bookshelf"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            책장으로
          </Link>
        </div>
      </div>
    </main>
  )
}
