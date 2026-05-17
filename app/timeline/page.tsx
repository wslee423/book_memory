import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/ui/StarRating'
import type { TimelineMonth } from '@/types'

interface RawBook {
  id: string
  title: string
  author: string | null
  category: string | null
  rating: number | null
  cover_url: string | null
  read_end: string
}

async function getTimeline(): Promise<TimelineMonth[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .schema('book_memory')
    .from('books')
    .select('id, title, author, category, rating, cover_url, read_end')
    .not('read_end', 'is', null)
    .order('read_end', { ascending: false })

  const books = (data ?? []) as RawBook[]
  const monthMap = new Map<string, typeof books>()

  for (const b of books) {
    const d = new Date(b.read_end)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(key)) monthMap.set(key, [])
    monthMap.get(key)!.push(b)
  }

  const KO_MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, items]) => {
      const [year, m] = month.split('-')
      return {
        month,
        label: `${year}년 ${KO_MONTHS[Number(m) - 1]}`,
        books: items.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          category: b.category,
          rating: b.rating,
          coverUrl: b.cover_url,
          readEnd: b.read_end,
        })),
      }
    })
}

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const timeline = await getTimeline()

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-8">독서 회고</h1>

      {timeline.length === 0 ? (
        <p className="text-gray-400 text-sm">완독 기록이 없습니다.</p>
      ) : (
        <div className="relative">
          {/* 타임라인 세로선 */}
          <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-gray-200" />

          <div className="flex flex-col gap-10">
            {timeline.map(({ month, label, books }) => (
              <div key={month} className="flex gap-6">
                {/* 날짜 레이블 */}
                <div className="w-20 shrink-0 text-right">
                  <span className="text-xs font-semibold text-gray-500 leading-tight">
                    {label.replace('년 ', '년\n')}
                  </span>
                </div>

                {/* 타임라인 점 */}
                <div className="relative flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white shadow mt-0.5 shrink-0" />
                </div>

                {/* 책 카드 목록 */}
                <div className="flex-1 flex flex-col gap-3 pb-2">
                  <p className="text-xs text-gray-400 -mt-0.5">{books.length}권</p>
                  {books.map((book) => (
                    <Link
                      key={book.id}
                      href={`/bookshelf/${book.id}`}
                      className="flex gap-3 p-3 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-colors"
                    >
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          width={48}
                          height={64}
                          className="w-12 h-16 object-cover rounded shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-100 rounded shrink-0 flex items-center justify-center text-gray-300 text-xs">
                          없음
                        </div>
                      )}
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">{book.title}</p>
                        {book.author && <p className="text-xs text-gray-500">{book.author}</p>}
                        <div className="flex items-center gap-2 mt-auto">
                          {book.rating && <StarRating rating={book.rating} />}
                          {book.category && (
                            <span className="text-xs text-gray-400">{book.category}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
