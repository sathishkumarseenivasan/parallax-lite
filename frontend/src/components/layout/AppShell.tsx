'use client'
/**
 * AppShell — shared sidebar + topbar layout used by ALL pages.
 *
 * Usage:
 *   <AppShell title="Transactions" subtitle="Full escrow history">
 *     {children}
 *   </AppShell>
 */
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, ArrowLeftRight, Users, Settings,
  Layers, Activity, TrendingUp, AlertCircle,
  ChevronRight, Maximize, Minimize
} from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { ProductTour } from '@/components/shared/ProductTour'
import { useHealth } from '@/hooks/useTransactions'
import { MOCK_TRANSACTIONS } from '@/lib/mock-pragmatic-data'

/* ─── Nav definition ────────────────────────────────────────────────────── */
const NAV = [
  { href: '/app',          icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { href: '/agents',       icon: Users,           label: 'Agents'       },
  { href: '/state',        icon: Layers,          label: 'State View'   },
  { href: '/settings',     icon: Settings,        label: 'Settings'     },
]

/* ─── Sidebar ────────────────────────────────────────────────────────────── */
function Sidebar() {
  const pathname = usePathname()
  const cleared  = MOCK_TRANSACTIONS.filter(t => t.status === 'CLEARED').length
  const rejected = MOCK_TRANSACTIONS.filter(t => t.status === 'REJECTED_DRIFT').length

  return (
    <aside
      className="flex-shrink-0 flex flex-col border-r border-gray-200 bg-white"
      style={{ width: 232, height: '100vh', position: 'sticky', top: 0 }}
      aria-label="Main navigation"
      role="navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden bg-black">
          <img src="/logo.png" alt="Parallax Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-none tracking-tight">Parallax</p>
          <p className="text-xs text-gray-400 leading-none mt-0.5">Protocol · v0.1</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-2 text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3" style={{ fontSize: 11 }}>
          Navigation
        </p>

        {NAV.map(item => {
          const isActive = item.href === '/app'
            ? pathname === '/app' || pathname === '/'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="nav-item"
              style={
                isActive
                  ? { background: '#EEF2FF', color: '#4F46E5', fontWeight: 600 }
                  : {}
              }
            >
              <item.icon size={16} />
              <span style={{ fontSize: 14 }}>{item.label}</span>
            </Link>
          )
        })}

        {/* Stats section */}
        <div className="pt-5 pb-1">
          <p className="px-2 text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2" style={{ fontSize: 11 }}>
            Live Stats
          </p>
        </div>

        <div className="space-y-0.5 px-1">
          <MiniStat label="Cleared"  value={cleared}  color="#059669" icon={TrendingUp} />
          <MiniStat label="Rejected" value={rejected} color="#E11D48" icon={AlertCircle} />
          <MiniStat label="Total TX" value={MOCK_TRANSACTIONS.length} color="#4F46E5" icon={Activity} />
        </div>
      </nav>

      {/* CMD+K button */}
      <div className="px-3 py-3 border-t border-gray-200">
        <button
          className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors text-left"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
        >
          <span className="text-sm text-gray-500">Quick actions</span>
          <kbd className="font-mono text-xs bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-500" aria-label="Ctrl+K shortcut">⌘K</kbd>
        </button>
      </div>
    </aside>
  )
}

function MiniStat({ label, value, color, icon: Icon }: {
  label: string; value: number; color: string; icon: React.ElementType
}) {
  return (
    <div className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2.5">
        <Icon size={14} style={{ color }} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="font-mono text-sm font-semibold" style={{ color }}>{value}</span>
    </div>
  )
}

import { useLiveStream } from '@/hooks/useLiveStream'
import { X, RotateCw } from 'lucide-react'

/* ─── TopBar ─────────────────────────────────────────────────────────────── */
function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { isHealthy, mode, features } = useHealth()
  const pathname      = usePathname()
  const [isDense, setIsDense] = useState(true)
  const [showConnection, setShowConnection] = useState(false)
  
  const { status, lastSeq, logs, reconnect } = useLiveStream()

  useEffect(() => {
    if (isDense) {
      document.body.classList.add('dense-ui')
      document.body.classList.remove('comfortable-ui')
    } else {
      document.body.classList.add('comfortable-ui')
      document.body.classList.remove('dense-ui')
    }
  }, [isDense])

  // Build breadcrumb segments
  const segments = pathname.split('/').filter(Boolean)
  
  const statusColor = status === 'live' ? '#059669' : status === 'fallback' ? '#E11D48' : '#D97706'
  const statusText = status === 'live' ? 'Stream Live' : status === 'connecting' ? 'Connecting...' : status === 'reconnecting' ? 'Reconnecting...' : 'Fallback Polling'

  return (
    <div
      className="flex items-center justify-between px-6 border-b border-gray-200 bg-white flex-shrink-0 relative"
      style={{ height: 52 }}
    >
      {/* Breadcrumb */}
      <div>
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <Link href="/app" className="text-gray-400 hover:text-gray-600 transition-colors">
            Dashboard
          </Link>
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight size={13} className="text-gray-300" />
              <span
                className="font-medium capitalize"
                style={{ color: i === segments.length - 1 ? '#111827' : '#6B7280' }}
              >
                {seg.replace(/-/g, ' ')}
              </span>
            </span>
          ))}
        </nav>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setShowConnection(!showConnection)}
          className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
        >
          <span
            className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(5,150,105,0.5)]"
            style={{ background: statusColor }}
          />
          <span className="text-sm font-medium text-gray-600">
            {statusText}
          </span>
        </button>
        
        {/* Connection Diagnostics Popover */}
        {showConnection && (
          <div className="absolute top-10 right-32 w-80 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Activity size={14} className="text-indigo-600" /> Connection Diagnostics
              </h3>
              <button onClick={() => setShowConnection(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            
            <div className="px-4 py-3 grid grid-cols-2 gap-4 text-sm border-b border-gray-100">
              <div>
                <span className="block text-xs text-gray-500 mb-0.5">Current Mode</span>
                <span className="font-medium" style={{ color: statusColor }}>{status.toUpperCase()}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-0.5">Last Sequence</span>
                <span className="font-mono font-medium">{lastSeq}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-0.5">API Status</span>
                <span className="font-medium text-gray-900">{isHealthy ? 'Operational' : 'Down'}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-0.5">Events Received</span>
                <span className="font-mono font-medium">{logs.length > 50 ? '50+' : logs.length}</span>
              </div>
            </div>
            
            <div className="px-4 py-2 bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">Auto-reconnect active</span>
              <button 
                onClick={() => { reconnect(); setShowConnection(false); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-2 py-1 rounded"
              >
                <RotateCw size={12} /> Force Reconnect
              </button>
            </div>
          </div>
        )}

        <div className="w-px h-5 bg-gray-200" />

        <button
          onClick={() => setIsDense(!isDense)}
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
          title={isDense ? 'Switch to Comfortable Mode' : 'Switch to Dense Mode'}
        >
          {isDense ? <Maximize size={15} /> : <Minimize size={15} />}
        </button>

        <div className="w-px h-5 bg-gray-200" />

        <div className="flex items-center gap-2">
          {features?.seed && (
            <button 
              onClick={async () => {
                const toastId = toast.loading('Seeding demo data...');
                try {
                  const res = await fetch('http://127.0.0.1:8000/api/agents/seed', { method: 'POST' });
                  if (!res.ok) throw new Error('Failed to seed');
                  toast.success('Demo data seeded successfully', { id: toastId });
                  setTimeout(() => window.location.reload(), 1000);
                } catch (err) {
                  toast.error('Failed to seed demo data', { id: toastId });
                }
              }}
              className="text-[11px] uppercase tracking-wider font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded hover:bg-indigo-100 transition-colors mr-2"
            >
              Demo Mode
            </button>
          )}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-semibold uppercase"
            style={{ background: '#4F46E5' }}
          >
            {mode ? mode[0] : 'D'}
          </div>
          <span className="text-sm font-medium text-gray-700 capitalize">{mode || 'Dev'}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── AppShell ───────────────────────────────────────────────────────────── */
interface AppShellProps {
  title:     string
  subtitle?: string
  children:  React.ReactNode
  /** Pass noPad to skip the default p-6 wrapper (for pages that manage their own padding) */
  noPad?: boolean
}

export function AppShell({ title, subtitle, children, noPad }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <CommandPalette />
      <ProductTour />

      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={title} subtitle={subtitle} />

        <main className={`flex-1 overflow-y-auto bg-gray-50 ${noPad ? '' : 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
