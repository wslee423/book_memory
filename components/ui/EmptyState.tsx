export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-gray-400">
      {message}
    </div>
  )
}
