'use client'
/**
 * VaultLedger — High-density, fully functional data table.
 * Features: column sorting, real-time search, status filter, pagination.
 */
import { useState, useMemo, useCallback } from 'react'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Search, ChevronLeft, ChevronRight, Copy, Check, X, Settings2, Download
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useAgents } from '@/hooks/useTransactions'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'
import type { PragmaticTx, TxStatus } from '@/lib/mock-pragmatic-data'

/* ── Types ─────────────────────────────────────────────────────────────── */
type SortKey  = 'id' | 'amount' | 'semantic_score' | 'latency_ms' | 'created_at' | 'status'
type SortDir  = 'asc' | 'desc'

const STATUS_OPTS: { value: TxStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',           label: 'All Statuses' },
  { value: 'CLEARED',       label: 'Cleared' },
  { value: 'REJECTED_DRIFT',label: 'Rejected' },
  { value: 'DISPUTED',      label: 'Disputed' },
  { value: 'LOCKED',        label: 'Locked' },
  { value: 'PENDING',       label: 'Pending' },
]

const PAGE_SIZES = [10, 25, 50]

const COLS_DEF: { label: string; key?: SortKey; align?: 'right' | 'center' }[] = [
  { label: 'TX ID',           key: 'id' },
  { label: 'Buyer',  },
  { label: 'Seller', },
  { label: 'Trust', },
  { label: 'Schema', },
  { label: 'Amount',          key: 'amount',         align: 'right' },
  { label: 'Stage',           align: 'center' },
  { label: 'Entropy',         key: 'semantic_score' },
  { label: 'Latency',         key: 'latency_ms',     align: 'right' },
  { label: 'Status',          key: 'status' },
  { label: 'Time',            key: 'created_at' },
]

/* ── Status Badge ─────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: TxStatus }) {
  const cls =
    status === 'CLEARED'        ? 'badge-cleared'  :
    status === 'REJECTED_DRIFT' ? 'badge-rejected' :
    status === 'DISPUTED'       ? 'badge-disputed' :
    status === 'LOCKED'         ? 'badge-locked'   : 'badge-pending'
  const label =
    status === 'REJECTED_DRIFT' ? 'Rejected' :
    status === 'DISPUTED'       ? 'Disputed' :
    status === 'LOCKED'         ? 'Locked'   :
    status === 'CLEARED'        ? 'Cleared'  : 'Pending'
  return <span className={`badge ${cls}`}>{label}</span>
}

/* ── Sort Icon ────────────────────────────────────────────────────────── */
function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={11} className="text-gray-300" />
  return dir === 'asc'
    ? <ChevronUp   size={11} className="text-indigo-600" />
    : <ChevronDown size={11} className="text-indigo-600" />
}

/* ── Copyable ID ──────────────────────────────────────────────────────── */
function CopyId({ id }: { id: string }) {
  const [ok, setOk] = useState(false)
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try { await navigator.clipboard.writeText(id); setOk(true); setTimeout(() => setOk(false), 1500) } catch {}
  }
  return (
    <span className="inline-flex items-center gap-1 group/id">
      <span className="truncate-id text-gray-700 max-w-[120px] truncate" title={id}>
        {id.length > 16 ? id.slice(0, 14) + '…' : id}
      </span>
      <button onClick={copy} className="opacity-0 group-hover/id:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
        {ok ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
      </button>
    </span>
  )
}

/* ── Main Component ───────────────────────────────────────────────────── */
interface Props {
  transactions: PragmaticTx[]
  onRowClick:   (tx: PragmaticTx) => void
  selectedId?:  string
}

export function VaultLedger({ transactions, onRowClick, selectedId }: Props) {
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState<TxStatus | 'ALL'>('ALL')
  const [sortKey,  setSortKey]  = useState<SortKey>('created_at')
  const [sortDir,  setSortDir]  = useState<SortDir>('desc')
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const { agents } = useAgents()
  const trustScores = useMemo(() => {
    const map = new Map<string, { score: number, verified: boolean }>()
    agents?.forEach(a => {
      if (a.trust_score !== undefined) {
        map.set(a.id, { score: a.trust_score, verified: false })
      }
    })
    return map
  }, [agents])

  // Enterprise Features State
  const [selectedTxs, setSelectedTxs] = useState<Set<string>>(new Set())
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(COLS_DEF.map(c => c.label)))
  const [showColMenu, setShowColMenu] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tx: PragmaticTx } | null>(null)

  useEffect(() => {
    const closeContext = () => setContextMenu(null)
    window.addEventListener('click', closeContext)
    return () => window.removeEventListener('click', closeContext)
  }, [])

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const n = new Set(selectedTxs)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    setSelectedTxs(n)
  }

  const handleContextMenu = (e: React.MouseEvent, tx: PragmaticTx) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, tx })
  }

  /* Debounced search for performance */
  const debouncedSearch = useDebounce(search, 200)

  /* Filter */
  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim()
    return transactions.filter(tx => {
      const matchStatus = status === 'ALL' || tx.status === status
      const matchSearch = !q
        || tx.id.toLowerCase().includes(q)
        || tx.buyer_id.toLowerCase().includes(q)
        || tx.seller_id.toLowerCase().includes(q)
        || tx.schema_name.toLowerCase().includes(q)
        || tx.task.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [transactions, debouncedSearch, status])

  /* Sort */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number, bv: string | number
      switch (sortKey) {
        case 'amount':         av = a.amount;         bv = b.amount;         break
        case 'semantic_score': av = a.semantic_score; bv = b.semantic_score; break
        case 'latency_ms':     av = a.latency_ms;     bv = b.latency_ms;     break
        case 'created_at':     av = a.created_at;     bv = b.created_at;     break
        case 'status':         av = a.status;         bv = b.status;         break
        default:               av = a.id;             bv = b.id
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  /* Paginate */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageData   = useMemo(() => {
    const start = (page - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }, [sortKey])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value); setPage(1)
  }
  const handleStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as TxStatus | 'ALL'); setPage(1)
  }

  const COLS = COLS_DEF.filter(c => visibleCols.has(c.label))

  return (
    <div className="box flex flex-col relative" style={{ minHeight: 0 }}>
      {/* Toolbar */}
      <div className="box-header flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 whitespace-nowrap">Vault Ledger</h2>
          <span className="font-mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
            {filtered.length} records
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -trangray-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search TX ID, agent, schema…"
              value={search}
              onChange={handleSearch}
              className="input pl-7"
              style={{ width: 220 }}
            />
          </div>

          {/* Status filter */}
          <select value={status} onChange={handleStatus} className="select">
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Page size */}
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="select"
            style={{ width: 80 }}
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / pg</option>)}
          </select>

          {/* Columns Toggle */}
          <div className="relative">
            <button 
              className="btn btn-default px-2.5" 
              onClick={() => setShowColMenu(!showColMenu)}
              title="Customize Columns"
            >
              <Settings2 size={13} className="text-gray-500" />
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-xl rounded-md p-2 z-40 w-48" onClick={e => e.stopPropagation()}>
                <p className="text-xs font-semibold text-gray-500 mb-2 px-1">Columns</p>
                {COLS_DEF.map(c => (
                  <label key={c.label} className="flex items-center gap-2 px-1 py-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={visibleCols.has(c.label)}
                      onChange={(e) => {
                        const n = new Set(visibleCols)
                        e.target.checked ? n.add(c.label) : n.delete(c.label)
                        setVisibleCols(n)
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-sm text-gray-700">{c.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="dense-table">
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-indigo-600"
                  checked={pageData.length > 0 && pageData.every(tx => selectedTxs.has(tx.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const n = new Set(selectedTxs)
                      pageData.forEach(tx => n.add(tx.id))
                      setSelectedTxs(n)
                    } else {
                      setSelectedTxs(new Set())
                    }
                  }}
                />
              </th>
              {COLS.map(col => (
                <th
                  key={col.label}
                  className={col.key ? 'sortable' : ''}
                  style={{ textAlign: col.align ?? 'left' }}
                  onClick={() => col.key && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.key && <SortIcon col={col.key} sortKey={sortKey} dir={sortDir} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={COLS.length + 1} className="text-center py-12 text-gray-400 text-sm">
                  No transactions match your filters.
                </td>
              </tr>
            ) : pageData.map(tx => {
              const isSelected = tx.id === selectedId
              const scoreColor =
                tx.semantic_score >= 90 ? '#059669' :
                tx.semantic_score >= 75 ? '#D97706' : '#E11D48'
              const latColor =
                tx.latency_ms < 1000 ? '#059669' :
                tx.latency_ms < 2000 ? '#D97706' : '#E11D48'

              return (
                <tr
                  key={tx.id}
                  onClick={() => onRowClick(tx)}
                  onContextMenu={(e) => handleContextMenu(e, tx)}
                  className="cursor-pointer group"
                  style={{
                    background: isSelected ? '#EEF2FF' : selectedTxs.has(tx.id) ? '#F3F4F6' : undefined,
                    outline: isSelected ? '1px solid #4F46E5' : undefined,
                    outlineOffset: -1,
                  }}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onRowClick(tx)}
                  aria-selected={isSelected}
                >
                  <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ opacity: selectedTxs.has(tx.id) ? 1 : undefined }}
                      checked={selectedTxs.has(tx.id)}
                      onChange={(e) => toggleSelect(e as any, tx.id)}
                    />
                  </td>
                  {visibleCols.has('TX ID') && <td><CopyId id={tx.id} /></td>}
                  {visibleCols.has('Buyer') && (
                    <td>
                      <span className="truncate-id text-gray-600 font-mono">
                        {tx.buyer_id.replace('agent_', '')}
                      </span>
                    </td>
                  )}
                  {visibleCols.has('Seller') && (
                    <td>
                      <span className="truncate-id text-gray-600 font-mono">
                        {tx.seller_id.replace('agent_', '')}
                      </span>
                    </td>
                  )}
                  {visibleCols.has('Trust') && (
                    <td>
                      <TrustScoreBadge 
                        score={trustScores.get(tx.seller_id)?.score} 
                        verified={trustScores.get(tx.seller_id)?.verified} 
                      />
                    </td>
                  )}
                  {visibleCols.has('Schema') && (
                    <td>
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: 11 }}
                      >
                        {tx.schema_name}
                      </span>
                    </td>
                  )}
                  {visibleCols.has('Amount') && (
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono font-semibold text-gray-900" style={{ fontSize: 12 }}>
                        {tx.amount.toFixed(4)}
                      </span>
                      <span className="text-gray-400 ml-1" style={{ fontSize: 10 }}>USDC</span>
                    </td>
                  )}
                  {visibleCols.has('Stage') && (
                    <td style={{ textAlign: 'center' }}>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        tx.stage === 1 ? 'bg-red-100 text-red-700' :
                        tx.stage === 2 ? 'bg-emerald-100 text-emerald-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                        S{tx.stage || 2}
                      </span>
                    </td>
                  )}
                  {visibleCols.has('Entropy') && (
                    <td>
                      <div className="flex items-center gap-2 w-full max-w-[80px]">
                        <span className="font-mono text-xs font-semibold" style={{ color: scoreColor, width: 32 }}>
                          {tx.semantic_score}%
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ width: `${tx.semantic_score}%`, backgroundColor: scoreColor }}
                          />
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleCols.has('Latency') && (
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono text-xs" style={{ color: latColor }}>
                        {tx.latency_ms}ms
                      </span>
                    </td>
                  )}
                  {visibleCols.has('Status') && <td><StatusBadge status={tx.status} /></td>}
                  {visibleCols.has('Time') && (
                    <td>
                      <span className="font-mono text-xs text-gray-400">
                        {relativeTime(tx.created_at)}
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50"
        style={{ fontSize: 12 }}
      >
        <span className="text-gray-500 font-mono">
          {Math.min((page - 1) * pageSize + 1, sorted.length)}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            className="btn btn-default"
            style={{ padding: '3px 8px' }}
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft size={13} />
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pg = totalPages <= 7 ? i + 1 : Math.max(1, page - 3) + i
            if (pg > totalPages) return null
            return (
              <button
                key={pg}
                className="btn"
                style={{
                  padding: '3px 8px',
                  background: pg === page ? '#4F46E5' : '#fff',
                  borderColor: pg === page ? '#4F46E5' : '#D1D5DB',
                  color: pg === page ? '#fff' : '#374151',
                  fontFamily: 'JetBrains Mono',
                }}
                onClick={() => setPage(pg)}
              >
                {pg}
              </button>
            )
          })}

          <button
            className="btn btn-default"
            style={{ padding: '3px 8px' }}
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedTxs.size > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            className="absolute bottom-[60px] left-1/2 -trangray-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-5 z-40 border border-gray-800"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold">
                {selectedTxs.size}
              </div>
              <span className="text-sm font-semibold text-gray-200">selected</span>
            </div>
            <div className="w-px h-5 bg-gray-700" />
            <button className="text-sm font-medium hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <Download size={14} /> Export CSV
            </button>
            <button className="text-sm font-medium hover:text-indigo-400 transition-colors">Retry All</button>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedTxs(new Set()) }}
              className="ml-2 p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 shadow-2xl rounded-lg py-1 min-w-[200px] text-sm overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 mb-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction</p>
            <p className="font-mono text-xs text-gray-900 truncate mt-0.5">{contextMenu.tx.id}</p>
          </div>
          <button onClick={() => { onRowClick(contextMenu.tx); setContextMenu(null) }} className="w-full text-left px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-medium">
            Open Inspector
          </button>
          <button onClick={() => { navigator.clipboard.writeText(contextMenu.tx.id); setContextMenu(null) }} className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors">
            Copy TX ID
          </button>
          <button onClick={() => { navigator.clipboard.writeText(`curl -X POST /api/transactions/${contextMenu.tx.id}/retry`); setContextMenu(null) }} className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors">
            Copy as cURL
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={() => setContextMenu(null)} className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 transition-colors">
            Close Menu
          </button>
        </div>
      )}
    </div>
  )
}

function relativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m`
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}
