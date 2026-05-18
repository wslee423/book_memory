export function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-300 dark:text-gray-600">★☆☆☆☆</span>
  return (
    <span className="text-yellow-400">
      {'★'.repeat(rating)}
      <span className="text-gray-300 dark:text-gray-600">{'☆'.repeat(5 - rating)}</span>
    </span>
  )
}
