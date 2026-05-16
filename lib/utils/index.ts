export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

export function formatRating(rating: number | null): string {
  if (!rating) return '-'
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}
