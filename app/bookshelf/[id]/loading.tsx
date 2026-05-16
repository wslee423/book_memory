export default function Loading() {
  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-8" />
        <div className="flex gap-6">
          <div className="w-[200px] h-[280px] bg-gray-200 rounded" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-2/3 bg-gray-200 rounded" />
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-4/5 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="mt-12 space-y-3">
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    </main>
  )
}
