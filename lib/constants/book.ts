export const STATUS_OPTIONS = [
  '완독',
  '읽는 중',
  '읽고 싶은 책',
  '완독 2회차',
  '중단',
  '소장',
  '서평완료',
  '속독',
  '상시',
] as const

export const COMPLETED_STATUSES: readonly string[] = [
  '완독',
  '완독 2회차',
  '서평완료',
]

export const RATING_OPTIONS = [1, 2, 3, 4, 5] as const

export const SORT_OPTIONS = [
  { value: 'read_end_desc', label: '완독일 최신순' },
  { value: 'rating_desc', label: '별점 높은순' },
  { value: 'created_at_asc', label: '등록일 오래된순' },
  { value: 'title_asc', label: '제목 가나다순' },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]['value']
