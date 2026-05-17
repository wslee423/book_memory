export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null
  return (
    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
      {status}
    </span>
  )
}
