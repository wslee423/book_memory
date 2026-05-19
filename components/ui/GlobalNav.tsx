'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function GlobalNav() {
  const pathname = usePathname()
  const links = [
    { href: '/bookshelf', label: '📚 책장' },
    { href: '/mate', label: '🤖 독서메이트' },
    { href: '/stats', label: '📊 통계' },
  ]
  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 h-14 flex items-center px-4 gap-4 overflow-x-auto">
      <Link href="/bookshelf" className="flex items-center gap-1.5 shrink-0 group">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500 shrink-0">
          <rect x="3" y="2" width="9" height="16" rx="1.5" className="fill-current opacity-20" />
          <rect x="3" y="2" width="9" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8" y="2" width="9" height="16" rx="1.5" className="fill-current opacity-10" />
          <rect x="8" y="2" width="9" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="5.5" y1="6" x2="9.5" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="5.5" y1="8.5" x2="9.5" y2="8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <span className="font-semibold text-sm tracking-tight">
          <span className="text-gray-900 dark:text-gray-100">book</span><span className="text-blue-500">_memory</span>
        </span>
      </Link>
      <div className="flex items-center gap-1 shrink-0">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              pathname?.startsWith(href)
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="ml-auto shrink-0">
        <ThemeToggle />
      </div>
    </nav>
  )
}
