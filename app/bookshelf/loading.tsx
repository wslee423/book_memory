export default function Loading() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-8 max-w-7xl mx-auto">
      <div className="animate-pulse">
        {/* 통계 헤더 스켈레톤 */}
        <div className="flex flex-wrap gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 w-20 h-16" />
          ))}
        </div>
        {/* 검색창 */}
        <div className="h-9 w-80 bg-gray-100 dark:bg-gray-800 rounded mb-4" />
        {/* 필터 */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
          ))}
        </div>
        {/* 정렬/뷰 컨트롤 */}
        <div className="flex justify-between mb-4">
          <div className="h-8 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="flex gap-1">
            <div className="h-8 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-8 w-10 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>
        {/* 갤러리 스켈레톤 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[5/7] bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
