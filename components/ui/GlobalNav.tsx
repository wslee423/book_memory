'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function GlobalNav() {
  const pathname = usePathname()
  const links = [
    { href: '/bookshelf', label: '책장' },
    { href: '/mate', label: '독서메이트' },
    { href: '/stats', label: '통계' },
  ]
  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 h-14 flex items-center px-4 gap-4 overflow-x-auto">
      <span className="font-bold text-gray-900 dark:text-gray-100 text-sm shrink-0">book_memory</span>
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
