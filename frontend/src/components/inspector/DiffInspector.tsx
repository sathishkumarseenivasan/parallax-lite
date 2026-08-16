'use client'
/**
 * DiffInspector — GitHub PR-style diff with Side-by-Side and Unified views.
 * Custom recursive TypeScript diffObjects logic — no external libraries.
 */
import { useState, useMemo } from 'react'
import { Copy, Check, Columns2, AlignLeft } from 'lucide-react'
import type { PragmaticTx } from '@/lib/mock-pragmatic-data'

/* ── Diff Engine ─────────────────────────────────────────────────────────── */

type DiffKind = 'MATCH' | 'TYPE_MISMATCH' | 'VALUE_MISMATCH' | 'MISSING' | 'EXTRA'

interface DiffEntry {
  key:      string
  expected: string
  actual:   string
  kind:     DiffKind
  depth:    number
}

function prettyVal(v: unknown, maxLen = 80): string {
  if (v === undefined) return '—'
  const s = JSON.stringify(v, null, 0)
  return s.length > maxLen ? s.slice(0, maxLen) + '…' : s
}

function jsType(v: unknown): string {
  if (v === null)       return 'null'
  if (Array.isArray(v)) return `array[${(v as unknown[]).length}]`
  return typeof v
}

export function diffObjects(
  expected: Record<string, unknown>,
  actual:   Record<string, unknown>,
  depth = 0,
  prefix = '',
): DiffEntry[] {
  const entries: DiffEntry[] = []
  const allKeys = new Set([...Object.keys(expected), ...Object.keys(actual)])

  for (const key of allKeys) {
    const fk  = prefix ? `${prefix}.${key}` : key
    const ev  = expected[key]
    const av  = actual[key]
    const eIn = key in expected
    const aIn = key in actual

    if (!eIn) { entries.push({ key: fk, expected: '—', actual: prettyVal(av), kind: 'EXTRA',   depth }); continue }
    if (!aIn) { entries.push({ key: fk, expected: prettyVal(ev), actual: '—',  kind: 'MISSING', depth }); continue }

    const et = jsType(ev), at = jsType(av)
    if (et !== at) {
      entries.push({ key: fk, expected: `${prettyVal(ev)} (${et})`, actual: `${prettyVal(av)} (${at})`, kind: 'TYPE_MISMATCH', depth })
    } else if (et === 'object' && ev !== null && av !== null && !Array.isArray(ev)) {
      entries.push(...diffObjects(ev as Record<string, unknown>, av as Record<string, unknown>, depth + 1, fk))
    } else if (JSON.stringify(ev) !== JSON.stringify(av)) {
      entries.push({ key: fk, expected: prettyVal(ev), actual: prettyVal(av), kind: 'VALUE_MISMATCH', depth })
    } else {
      entries.push({ key: fk, expected: prettyVal(ev), actual: prettyVal(av), kind: 'MATCH', depth })
    }
  }
  return entries
}

/* ── Rendering helpers ───────────────────────────────────────────────────── */

const KIND_STYLE: Record<DiffKind, { row: string; label: string; labelColor: string }> = {
  MATCH:          { row: '',        label: '',          labelColor: '' },
  TYPE_MISMATCH:  { row: 'diff-del', label: 'TYPE',     labelColor: '#E11D48' },
  VALUE_MISMATCH: { row: 'diff-del', label: 'VALUE',    labelColor: '#D97706' },
  MISSING:        { row: 'diff-del', label: 'MISSING',  labelColor: '#E11D48' },
  EXTRA:          { row: 'diff-del', label: 'EXTRA',    labelColor: '#D97706' },
}

/* ── Side-by-side view ──────────────────────────────────────────────────── */

function SideBySide({ entries }: { entries: DiffEntry[] }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', fontSize: 11 }}>
      {/* Column headers */}
      <div className="px-3 py-2 border-b border-r border-gray-200 bg-gray-50 font-semibold uppercase tracking-wider text-gray-500" style={{ fontSize: 10 }}>
        Expected Schema
      </div>
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 font-semibold uppercase tracking-wider text-gray-500" style={{ fontSize: 10 }}>
        Actual Output (Agent)
      </div>

      {/* Rows */}
      {entries.map((e, i) => {
        const s      = KIND_STYLE[e.kind]
        const isErr  = e.kind !== 'MATCH'
        const indent = { paddingLeft: 12 + e.depth * 16 }

        return (
          <>
            {/* Expected cell */}
            <div
              key={`exp-${i}`}
              className={`flex items-start border-b border-r border-gray-200 py-1.5 pr-3 font-mono ${s.row}`}
              style={indent}
            >
              <span className="text-gray-400 mr-2 flex-shrink-0 select-none" style={{ minWidth: 22 }}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="text-gray-500 mr-1">{e.key.split('.').pop()}:</span>
                <span style={{ color: isErr ? '#059669' : '#374151', wordBreak: 'break-all' }}>
                  {e.kind === 'EXTRA' ? <span className="text-gray-300 italic">—</span> : e.expected}
                </span>
              </div>
            </div>

            {/* Actual cell */}
            <div
              key={`act-${i}`}
              className={`flex items-start border-b border-gray-200 py-1.5 pr-3 font-mono ${s.row}`}
              style={indent}
            >
              <span className="text-gray-400 mr-2 flex-shrink-0 select-none" style={{ minWidth: 22 }}>{i + 1}</span>
              <div className="flex items-start justify-between flex-1 min-w-0 gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-500 mr-1">{e.key.split('.').pop()}:</span>
                  <span style={{ color: isErr ? '#E11D48' : '#374151', wordBreak: 'break-all' }}>
                    {e.kind === 'MISSING' ? <span className="text-gray-300 italic">—</span> : e.actual}
                  </span>
                </div>
                {isErr && s.label && (
                  <span
                    className="flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded border font-mono"
                    style={{ fontSize: 9, color: s.labelColor, borderColor: `${s.labelColor}30`, background: `${s.labelColor}08` }}
                  >
                    {s.label}
                  </span>
                )}
              </div>
            </div>
          </>
        )
      })}
    </div>
  )
}

/* ── Unified view ────────────────────────────────────────────────────────── */

function UnifiedView({ entries }: { entries: DiffEntry[] }) {
  return (
    <div style={{ fontSize: 11 }}>
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 font-semibold uppercase tracking-wider text-gray-500" style={{ fontSize: 10 }}>
        Unified Diff
      </div>
      {entries.map((e, i) => {
        const isErr = e.kind !== 'MATCH'
        return (
          <div key={i}>
            {/* Expected line */}
            <div
              className={`flex items-start font-mono py-1 pr-3 border-b border-gray-100 ${isErr ? 'diff-del' : 'diff-neutral'}`}
              style={{ paddingLeft: 12 + e.depth * 16 }}
            >
              <span className="text-gray-300 mr-2 w-5 text-right select-none" style={{ minWidth: 20 }}>{i * 2 + 1}</span>
              <span className={`mr-2 font-bold flex-shrink-0 w-3 ${isErr ? 'text-emerald-600' : 'text-gray-300'}`}>
                {isErr ? '+' : ' '}
              </span>
              <span className="text-gray-500 mr-1">{e.key.split('.').pop()}:</span>
              <span style={{ color: isErr ? '#059669' : '#374151' }}>
                {e.expected}
              </span>
            </div>
            {/* Actual line (only if different) */}
            {isErr && (
              <div
                className="flex items-start font-mono py-1 pr-3 border-b border-gray-100 diff-del"
                style={{ paddingLeft: 12 + e.depth * 16 }}
              >
                <span className="text-gray-300 mr-2 w-5 text-right select-none" style={{ minWidth: 20 }}>{i * 2 + 2}</span>
                <span className="mr-2 font-bold text-rose-500 flex-shrink-0 w-3">−</span>
                <span className="text-gray-500 mr-1">{e.key.split('.').pop()}:</span>
                <span style={{ color: '#E11D48' }}>{e.actual}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────────────────── */

interface Props { tx: PragmaticTx }

export function DiffInspector({ tx }: Props) {
  const [view, setView]       = useState<'side-by-side' | 'unified'>('side-by-side')
  const [copied, setCopied]   = useState(false)

  const entries = useMemo(
    () => diffObjects(tx.expected_schema, tx.actual_output),
    [tx]
  )

  const errorCount = entries.filter(e => e.kind !== 'MATCH').length
  const matchCount = entries.filter(e => e.kind === 'MATCH').length

  const handleCopyExpected = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(tx.expected_schema, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Diff Inspector</h3>
          <div className="flex items-center gap-2 text-xs">
            {errorCount > 0 && (
              <span className="font-mono font-semibold" style={{ color: '#E11D48' }}>
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            <span className="font-mono text-gray-400">{matchCount} match</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded overflow-hidden">
            <button
              onClick={() => setView('side-by-side')}
              title="Side-by-side"
              className="p-1.5 transition-colors"
              style={{
                background: view === 'side-by-side' ? '#4F46E5' : '#fff',
                color:      view === 'side-by-side' ? '#fff' : '#6B7280',
                borderRight: '1px solid #E5E7EB',
              }}
            >
              <Columns2 size={13} />
            </button>
            <button
              onClick={() => setView('unified')}
              title="Unified"
              className="p-1.5 transition-colors"
              style={{
                background: view === 'unified' ? '#4F46E5' : '#fff',
                color:      view === 'unified' ? '#fff' : '#6B7280',
              }}
            >
              <AlignLeft size={13} />
            </button>
          </div>

          <button onClick={handleCopyExpected} className="btn btn-default text-xs">
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            Copy Expected
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-b border-gray-200 bg-gray-50 flex-shrink-0" style={{ fontSize: 11 }}>
        <span className="font-mono text-gray-400">{entries.length} fields</span>
        <span className="font-mono" style={{ color: '#E11D48' }}>{errorCount} errors</span>
        <span className="font-mono" style={{ color: '#059669' }}>{matchCount} match</span>
        <span className="ml-auto font-mono text-gray-400">Schema: {tx.schema_name}</span>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto">
        {view === 'side-by-side'
          ? <SideBySide entries={entries} />
          : <UnifiedView entries={entries} />
        }
      </div>
    </div>
  )
}
