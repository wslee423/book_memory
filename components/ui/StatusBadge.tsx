import type { BookStatus } from '@/types'

export function StatusBadge({ status }: { status: BookStatus | null }) {
  if (!status) return null
  return (
    <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded">
      {status}
    </span>
  )
}
