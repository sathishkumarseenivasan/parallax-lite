'use client'

/**
 * CommandPalette — CMD+K global command interface.
 *
 * Instant, no loading spinners. Keyboard-driven.
 * Actions: Search TX ID, Go to Drift Inspector, Toggle Theme, Seed Demo Data.
 */

import { useEffect, useState, useCallback } from 'react'
import { Command } from 'cmdk'
import {
  Search, Database, GitCompare, Sun, Moon, Activity,
  Cpu, RotateCw, ArrowRight, Terminal as TerminalIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTransactions, useAgents, useHealth } from '@/hooks/useTransactions'

interface CommandAction {
  id:       string
  label:    string
  sublabel?: string
  icon:     React.ReactNode
  shortcut?: string[]
  onSelect: () => void
  group:    string
  searchValue?: string
}

export function CommandPalette() {
  const { isHealthy, features } = useHealth()
  const [open,  setOpen]  = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [recentIds, setRecentIds] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    try { setRecentIds(JSON.parse(localStorage.getItem('recent_cmds') || '[]')) } catch {}
  }, [])

  const close = useCallback(() => setOpen(false), [])

  // Toggle on CMD/CTRL+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSeed = useCallback(async () => {
    close()
    const toastId = toast.loading('Seeding demo data…')
    try {
      const { agentsApi } = await import('@/lib/api')
      await agentsApi.seed()
      toast.success('Demo data seeded successfully', { id: toastId })
      window.dispatchEvent(new Event('seed_success'))
    } catch {
      toast.error('Seed failed — is the backend running?', { id: toastId })
    }
  }, [close])

  const STATIC_ACTIONS: CommandAction[] = [
    {
      id:       'drift-inspector',
      group:    'Navigate',
      label:    'Drift Inspector',
      sublabel: 'Open the State Observability view',
      icon:     <GitCompare size={15} />,
      shortcut: ['G', 'D'],
      onSelect: () => { close(); router.push('/app') },
    },
    {
      id:       'transactions',
      group:    'Navigate',
      label:    'All Transactions',
      sublabel: 'Browse full ledger history',
      icon:     <Activity size={15} />,
      shortcut: ['G', 'T'],
      onSelect: () => { close(); router.push('/transactions') },
    },
    {
      id:       'agents',
      group:    'Navigate',
      label:    'Agent Registry',
      sublabel: 'Manage buyer & seller agents',
      icon:     <Cpu size={15} />,
      shortcut: ['G', 'A'],
      onSelect: () => { close(); router.push('/agents') },
    },
    ...(features?.seed ? [{
      id:       'seed',
      group:    'Actions',
      label:    'Seed Demo Data',
      sublabel: 'Populate with synthetic transactions',
      icon:     <Database size={15} />,
      onSelect: handleSeed,
    }] : []),
    {
      id:       'replay',
      group:    'Actions',
      label:    'Replay Last Transaction',
      sublabel: 'Re-run validation on tx_semver_0x3b',
      icon:     <RotateCw size={15} />,
      onSelect: () => {
        close()
        toast.loading('Replaying tx_semver_0x3b…', { id: 'cmd-replay' })
        setTimeout(() => {
          toast.error('Replay failed: Same type drift on `validated`.', { id: 'cmd-replay' })
        }, 1800)
      },
    },
    {
      id:       'copy-curl',
      group:    'Actions',
      label:    'Copy cURL for Last TX',
      sublabel: 'Copies replay command to clipboard',
      icon:     <TerminalIcon size={15} />,
      onSelect: async () => {
        close()
        const curl = `curl -X POST https://api.parallax.protocol/v1/transactions/replay \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $PARALLAX_TOKEN" \\
  -d '{"tx_id": "tx_semver_0x3b"}'`
        try {
          await navigator.clipboard.writeText(curl)
          toast.success('cURL copied to clipboard')
        } catch {
          toast.error('Copy failed')
        }
      },
    },
    {
      id:       'restart-tour',
      group:    'Actions',
      label:    'Restart Product Tour',
      sublabel: 'Replay the guided spotlight tour',
      icon:     <RotateCw size={15} />,
      shortcut: ['?'],
      onSelect: () => {
        close()
        window.dispatchEvent(new Event('start_tour'))
      },
    },
    {
      id:       'toggle-theme',
      group:    'Appearance',
      label:    theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode',
      sublabel: 'Coming in Phase 2',
      icon:     theme === 'light' ? <Moon size={15} /> : <Sun size={15} />,
      onSelect: () => {
        toast.info('Dark mode coming in Phase 2')
        setTheme((t) => (t === 'light' ? 'dark' : 'light'))
        close()
      },
    },
    {
      id:       'clear-filters',
      group:    'Actions',
      label:    'Clear All Filters',
      sublabel: 'Reset table views across the app',
      icon:     <RotateCw size={15} />,
      onSelect: () => { close(); toast.success('Filters cleared') },
    },
  ]

  const { transactions } = useTransactions({ limit: 15 })
  const { agents } = useAgents()

  const TX_ACTIONS: CommandAction[] = transactions.map(tx => ({
    id: `tx-${tx.id}`,
    group: 'Recent Transactions',
    label: `Inspect ${tx.id}`,
    sublabel: `${tx.amount} USDC • ${tx.status}`,
    icon: <Activity size={15} />,
    searchValue: `${tx.id} ${tx.id.replace('_', '')}`,
    onSelect: () => { close(); window.dispatchEvent(new CustomEvent('open_tx', { detail: tx })) }
  }))

  const AGENT_ACTIONS: CommandAction[] = agents.map(ag => ({
    id: `ag-${ag.id}`,
    group: 'Agents',
    label: ag.name,
    sublabel: `${ag.role} • ${ag.balance.toFixed(2)} USDC`,
    icon: <Cpu size={15} />,
    searchValue: `${ag.id} ${ag.name} ${ag.id.replace('_', '')}`,
    onSelect: () => { close(); router.push('/agents') }
  }))

  const ALL_ACTIONS = [...STATIC_ACTIONS, ...TX_ACTIONS, ...AGENT_ACTIONS]

  const executeCommand = (action: CommandAction) => {
    const next = [action.id, ...recentIds.filter(id => id !== action.id)].slice(0, 5)
    setRecentIds(next)
    localStorage.setItem('recent_cmds', JSON.stringify(next))
    action.onSelect()
  }

  const renderAction = (action: CommandAction) => (
    <Command.Item
      key={action.id}
      value={action.searchValue ? `${action.label} ${action.sublabel} ${action.searchValue}` : `${action.label} ${action.sublabel ?? ''}`}
      onSelect={() => executeCommand(action)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer outline-none transition-colors data-[selected=true]:bg-indigo-50"
      style={{ color: '#1C1917' }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: '#F5F5F4', color: '#78716C' }}
      >
        {action.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: '#1C1917' }}>
          {action.label}
        </div>
        {action.sublabel && (
          <div className="text-xs truncate" style={{ color: '#A8A29E' }}>
            {action.sublabel}
          </div>
        )}
      </div>

      {action.shortcut ? (
        <div className="flex items-center gap-1">
          {action.shortcut.map((k) => (
            <kbd
              key={k}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(231,229,228,0.8)',
                color: '#78716C',
              }}
            >
              {k}
            </kbd>
          ))}
        </div>
      ) : (
        <ArrowRight size={13} style={{ color: '#D4D0CB', flexShrink: 0 }} />
      )}
    </Command.Item>
  )

  // Groups logic
  const groups = Array.from(new Set(ALL_ACTIONS.map((a) => a.group)))
  const recentActionObjs = recentIds.map(id => ALL_ACTIONS.find(a => a.id === id)).filter(Boolean) as CommandAction[]

  return (
    <AnimatePresence>
      {open && (
        <Command.Dialog
          open={open}
          onOpenChange={setOpen}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[16vh]"
          label="Parallax Command Menu"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0"
            style={{ background: 'rgba(28,25,23,0.3)', backdropFilter: 'blur(8px)' }}
            onClick={close}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{ opacity: 0, scale: 0.96,    y: -8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
            className="relative w-full max-w-[520px] rounded-2xl overflow-hidden outline-none"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(231,229,228,0.9)',
              boxShadow: '0 24px 64px -12px rgba(28,25,23,0.2), 0 8px 24px -8px rgba(28,25,23,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            {/* Top gradient bar */}
            <div className="absolute top-0 inset-x-0 h-[1px]">
              <div
                className="absolute inset-0 animate-marquee"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(217,119,6,0.5), transparent)',
                  width: '200%',
                }}
              />
            </div>

            {/* Search input */}
            <div
              className="flex items-center gap-3 px-4 py-4 border-b"
              style={{ borderBottomColor: 'rgba(231,229,228,0.6)' }}
            >
              <Search size={16} style={{ color: '#A8A29E', flexShrink: 0 }} />
              <Command.Input
                autoFocus
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                style={{ color: '#1C1917', caretColor: '#D97706' }}
              />
              <div className="flex items-center gap-1">
                <kbd
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                  style={{
                    background: '#F5F5F4',
                    border: '1px solid rgba(231,229,228,0.8)',
                    color: '#78716C',
                  }}
                >
                  ESC
                </kbd>
              </div>
            </div>

            {/* Results */}
            <Command.List
              className="max-h-[360px] overflow-y-auto p-2 outline-none"
              style={{ scrollbarWidth: 'none' }}
            >
              <Command.Empty
                className="py-8 text-center text-sm"
                style={{ color: '#A8A29E' }}
              >
                No results found.
              </Command.Empty>

              {recentActionObjs.length > 0 && (
                <Command.Group
                  heading="Recent Commands"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
                  style={{ ['--cmdk-group-heading-color' as string]: '#A8A29E' }}
                >
                  {recentActionObjs.map(renderAction)}
                </Command.Group>
              )}

              {groups.map((group) => (
                <Command.Group
                  key={group}
                  heading={group}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
                  style={{ ['--cmdk-group-heading-color' as string]: '#A8A29E' }}
                >
                  {ALL_ACTIONS.filter((a) => a.group === group && !recentIds.includes(a.id)).map(renderAction)}
                </Command.Group>
              ))}
            </Command.List>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-t"
              style={{
                borderTopColor: 'rgba(231,229,228,0.6)',
                background: '#FAFAF9',
              }}
            >
              <span className="text-[10px] font-mono" style={{ color: '#A8A29E' }}>
                Parallax Protocol · v0.1.0
              </span>
              <div className="flex items-center gap-3">
                {[
                  { key: '↑↓', label: 'navigate' },
                  { key: '↵',  label: 'select' },
                  { key: 'ESC', label: 'close' },
                ].map(({ key, label }) => (
                  <span key={key} className="flex items-center gap-1 text-[10px]" style={{ color: '#A8A29E' }}>
                    <kbd
                      className="font-mono px-1 py-0.5 rounded text-[9px]"
                      style={{ background: '#F5F5F4', border: '1px solid rgba(231,229,228,0.8)' }}
                    >
                      {key}
                    </kbd>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </Command.Dialog>
      )}
    </AnimatePresence>
  )
}
