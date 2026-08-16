'use client'

/**
 * Header — top navigation bar.
 * Premium floating style with system status and abstract logo.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useHealth } from '@/hooks/useTransactions'
import { Check } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/' },
  { label: 'State View', href: '/state' },
  { label: 'Transactions', href: '/transactions' },
  { label: 'Agents',     href: '/agents' },
]

export function Header() {
  const pathname = usePathname()
  const { isHealthy } = useHealth()

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-6 h-6 flex items-center justify-center bg-gray-900 rounded-md">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-gray-900">
            Parallax
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-widest">
            Lite
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* System status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200/50">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">API</span>
            {isHealthy ? (
              <div className="flex items-center gap-1 text-emerald-600">
                <Check size={10} strokeWidth={3} />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Operational</span>
              </div>
            ) : (
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Connecting...</span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200/50">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">MCP</span>
            <div className="flex items-center gap-1 text-emerald-600">
              <Check size={10} strokeWidth={3} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Synced</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
