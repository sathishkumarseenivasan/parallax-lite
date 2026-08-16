'use client'

/**
 * DriftInspector — "The Killer Feature"
 *
 * A full-height right-side Sheet that opens when a REJECTED_DRIFT
 * transaction is clicked. It renders a surgical, side-by-side diff
 * between the Expected Schema and the Actual Output.
 *
 * The custom diff logic recursively walks both JSON objects and marks
 * keys as: MATCH | TYPE_MISMATCH | VALUE_MISMATCH | MISSING | EXTRA
 * — without any external diff library.
 */

import React, { useState, useCallback, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Copy, Check, AlertTriangle, GitCompare, Clock, Play,
  RotateCw, ChevronRight, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import type { MockStateTransaction } from '@/lib/mock-state-data'
import { TimelineDetailPanel } from '@/components/timeline/StateTransitionTimeline'

/* ─── Diff Engine ─────────────────────────────────────────────────────────── */

export type DiffKind =
  | 'MATCH'
  | 'TYPE_MISMATCH'
  | 'VALUE_MISMATCH'
  | 'MISSING'          // key in expected, not in actual
  | 'EXTRA'            // key in actual, not in expected

export interface DiffLine {
  key:      string
  expected: string   // pretty-printed value or type description
  actual:   string   // pretty-printed value or type description
  kind:     DiffKind
  depth:    number
}

function prettyType(v: unknown): string {
  if (v === null)             return 'null'
  if (Array.isArray(v))       return `array[${(v as unknown[]).length}]`
  return typeof v
}

function prettyValue(v: unknown, maxLen = 60): string {
  if (v === undefined) return '—'
  const s = JSON.stringify(v)
  return s.length > maxLen ? s.slice(0, maxLen) + '…' : s
}

/**
 * diffObjects — recursively compares two JSON-like objects.
 * Returns a flat list of DiffLine entries suitable for rendering.
 */
export function diffObjects(
  expected: Record<string, unknown>,
  actual:   Record<string, unknown>,
  depth    = 0,
  prefix   = '',
): DiffLine[] {
  const lines: DiffLine[] = []
  const allKeys = new Set([...Object.keys(expected), ...Object.keys(actual)])

  for (const key of allKeys) {
    const fullKey    = prefix ? `${prefix}.${key}` : key
    const expVal     = expected[key]
    const actVal     = actual[key]
    const expMissing = !(key in expected)
    const actMissing = !(key in actual)

    if (expMissing) {
      lines.push({ key: fullKey, expected: '—', actual: prettyValue(actVal), kind: 'EXTRA', depth })
      continue
    }
    if (actMissing) {
      lines.push({ key: fullKey, expected: prettyValue(expVal), actual: '—', kind: 'MISSING', depth })
      continue
    }

    const expType = prettyType(expVal)
    const actType = prettyType(actVal)

    if (expType !== actType) {
      // Type mismatch — the most important drift signal
      lines.push({
        key: fullKey,
        expected: `${prettyValue(expVal)} (${expType})`,
        actual:   `${prettyValue(actVal)} (${actType})`,
        kind:     'TYPE_MISMATCH',
        depth,
      })
    } else if (
      typeof expVal === 'object' && expVal !== null &&
      typeof actVal === 'object' && actVal !== null &&
      !Array.isArray(expVal) && !Array.isArray(actVal)
    ) {
      // Recurse into nested object
      lines.push(...diffObjects(
        expVal as Record<string, unknown>,
        actVal as Record<string, unknown>,
        depth + 1,
        fullKey,
      ))
    } else if (JSON.stringify(expVal) !== JSON.stringify(actVal)) {
      lines.push({
        key: fullKey,
        expected: prettyValue(expVal),
        actual:   prettyValue(actVal),
        kind:     'VALUE_MISMATCH',
        depth,
      })
    } else {
      lines.push({
        key: fullKey,
        expected: prettyValue(expVal),
        actual:   prettyValue(actVal),
        kind:     'MATCH',
        depth,
      })
    }
  }

  return lines
}

/* ─── Diff Viewer ─────────────────────────────────────────────────────────── */

const KIND_STYLES: Record<DiffKind, { bg: string; border: string; label: string; labelColor: string }> = {
  MATCH:         { bg: 'transparent',              border: 'transparent',         label: '',                labelColor: '' },
  TYPE_MISMATCH: { bg: 'rgba(225,29,72,0.06)',     border: '#E11D48',             label: 'TYPE',            labelColor: '#E11D48' },
  VALUE_MISMATCH:{ bg: 'rgba(217,119,6,0.06)',     border: '#D97706',             label: 'VALUE',           labelColor: '#D97706' },
  MISSING:       { bg: 'rgba(225,29,72,0.05)',     border: '#E11D48',             label: 'MISSING',         labelColor: '#E11D48' },
  EXTRA:         { bg: 'rgba(217,119,6,0.05)',     border: '#D97706',             label: 'EXTRA',           labelColor: '#D97706' },
}

function DiffRow({ line, isError }: { line: DiffLine; isError: boolean }) {
  const style = KIND_STYLES[line.kind]

  return (
    <div
      className="grid grid-cols-[180px_1fr_1fr] text-[11px] font-mono border-b"
      style={{
        borderBottomColor: 'rgba(231,229,228,0.5)',
        background: style.bg,
        borderLeft: isError ? `2px solid ${style.border}` : '2px solid transparent',
      }}
    >
      {/* Key column */}
      <div
        className="flex items-center gap-1 px-3 py-2 border-r"
        style={{
          paddingLeft: 12 + line.depth * 12,
          borderRightColor: 'rgba(231,229,228,0.5)',
          color: isError ? '#1C1917' : '#78716C',
        }}
      >
        {line.depth > 0 && (
          <ChevronRight size={9} className="flex-shrink-0 text-stone-300" />
        )}
        <span className="truncate font-medium">{line.key}</span>
        {isError && style.label && (
          <span
            className="ml-auto flex-shrink-0 text-[8px] font-semibold tracking-wider uppercase px-1 py-0.5 rounded"
            style={{ background: `${style.border}18`, color: style.labelColor }}
          >
            {style.label}
          </span>
        )}
      </div>

      {/* Expected column */}
      <div
        className="px-3 py-2 border-r truncate"
        style={{
          borderRightColor: 'rgba(231,229,228,0.5)',
          color: '#059669',
        }}
        title={line.expected}
      >
        {line.kind === 'MISSING' ? (
          <span className="text-stone-300 italic">—</span>
        ) : (
          line.expected
        )}
      </div>

      {/* Actual column */}
      <div
        className="px-3 py-2 truncate"
        style={{ color: isError ? '#E11D48' : '#1C1917' }}
        title={line.actual}
      >
        {line.kind === 'EXTRA' ? (
          <span className="text-amber-600">{line.actual}</span>
        ) : line.actual === '—' ? (
          <span className="text-stone-300 italic">—</span>
        ) : (
          line.actual
        )}
      </div>
    </div>
  )
}

function DiffViewer({
  expectedObj,
  actualObj,
}: {
  expectedObj: Record<string, unknown>
  actualObj:   Record<string, unknown>
}) {
  const diffLines = useMemo(
    () => diffObjects(expectedObj, actualObj),
    [expectedObj, actualObj],
  )

  const errorCount = diffLines.filter((l) => l.kind !== 'MATCH').length
  const matchCount = diffLines.filter((l) => l.kind === 'MATCH').length

  return (
    <div className="flex flex-col h-full">
      {/* Diff summary bar */}
      <div
        className="flex items-center gap-4 px-4 py-2 border-b text-[10px] font-mono flex-shrink-0"
        style={{ borderBottomColor: 'rgba(231,229,228,0.6)', background: '#FAFAF9' }}
      >
        <span className="text-stone-400">{diffLines.length} fields</span>
        <span style={{ color: '#E11D48' }}>
          {errorCount} {errorCount === 1 ? 'error' : 'errors'}
        </span>
        <span style={{ color: '#059669' }}>{matchCount} match</span>
      </div>

      {/* Column headers */}
      <div
        className="grid grid-cols-[180px_1fr_1fr] text-[9px] font-semibold uppercase tracking-widest border-b flex-shrink-0"
        style={{ borderBottomColor: 'rgba(231,229,228,0.7)', background: '#FAFAF9' }}
      >
        <div className="px-3 py-2 text-stone-400 border-r" style={{ borderRightColor: 'rgba(231,229,228,0.5)' }}>
          Field
        </div>
        <div className="px-3 py-2 border-r" style={{ color: '#059669', borderRightColor: 'rgba(231,229,228,0.5)' }}>
          Expected
        </div>
        <div className="px-3 py-2" style={{ color: '#E11D48' }}>
          Actual (Agent)
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {diffLines.map((line, i) => (
          <DiffRow
            key={`${line.key}-${i}`}
            line={line}
            isError={line.kind !== 'MATCH'}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Rejection Trace ────────────────────────────────────────────────────── */

function RejectionTrace({ reason }: { reason: string }) {
  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: 'rgba(225,29,72,0.2)', background: '#1C0A0E' }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{ borderBottomColor: 'rgba(225,29,72,0.15)', background: '#250E14' }}
      >
        <AlertTriangle size={12} style={{ color: '#E11D48' }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#E11D48' }}>
          Pydantic Validation Trace
        </span>
      </div>
      <pre
        className="px-4 py-4 text-[11px] leading-relaxed overflow-x-auto"
        style={{ color: '#FECDD3', fontFamily: 'var(--font-geist-mono), JetBrains Mono, monospace' }}
      >
        {reason}
      </pre>
    </div>
  )
}

/* ─── Main DriftInspector Sheet ──────────────────────────────────────────── */

interface DriftInspectorProps {
  transaction: MockStateTransaction | null
  open:         boolean
  onOpenChange: (open: boolean) => void
}

export function DriftInspector({
  transaction,
  open,
  onOpenChange,
}: DriftInspectorProps) {
  const [copied, setCopied]         = useState(false)
  const [isReplaying, setIsReplaying] = useState(false)
  const [activeTab, setActiveTab]   = useState<'diff' | 'timeline' | 'trace'>('diff')

  const handleCopySchema = useCallback(async () => {
    if (!transaction) return
    const schema = JSON.stringify(transaction.expected_schema, null, 2)
    try {
      await navigator.clipboard.writeText(schema)
      setCopied(true)
      toast.success('Expected schema copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [transaction])

  const handleCopyCurl = useCallback(async () => {
    if (!transaction) return
    const curl = `curl -X POST https://api.parallax.protocol/v1/transactions/replay \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $PARALLAX_TOKEN" \\
  -d '{"tx_id": "${transaction.id}"}'`
    try {
      await navigator.clipboard.writeText(curl)
      toast.success('cURL command copied')
    } catch {
      toast.error('Failed to copy')
    }
  }, [transaction])

  const handleReplay = useCallback(() => {
    setIsReplaying(true)
    toast.loading('Replaying transaction…', { id: 'replay-drift' })
    setTimeout(() => {
      setIsReplaying(false)
      toast.error('Replay failed: Same type drift detected on `validated` field.', { id: 'replay-drift' })
    }, 1800)
  }, [])

  if (!transaction) return null

  const isRejected = transaction.status === 'REJECTED_DRIFT'
  const errorCount = useMemo(() => {
    if (!isRejected) return 0
    return diffObjects(transaction.expected_schema, transaction.actual_output)
      .filter(l => l.kind !== 'MATCH').length
  }, [isRejected, transaction])

  const TABS = [
    { id: 'diff'     as const, label: 'Drift Diff',     badge: isRejected ? errorCount : null },
    { id: 'timeline' as const, label: 'State Timeline', badge: null },
    { id: 'trace'    as const, label: 'Error Trace',    badge: isRejected ? 1 : null },
  ]

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50"
                style={{ background: 'rgba(28,25,23,0.35)', backdropFilter: 'blur(4px)' }}
              />
            </Dialog.Overlay>

            {/* Sheet */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: '100%', opacity: 0.7 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0.5 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.9 }}
                className="fixed inset-y-0 right-0 z-50 flex flex-col outline-none"
                style={{
                  width: '780px',
                  maxWidth: '95vw',
                  background: '#FFFFFF',
                  borderLeft: '1px solid rgba(231,229,228,0.8)',
                  boxShadow: '0 24px 64px -12px rgba(28,25,23,0.18), 0 8px 24px -8px rgba(28,25,23,0.08)',
                }}
              >
                {/* ── Sheet Header ── */}
                <div
                  className="flex items-start justify-between px-6 py-5 flex-shrink-0 border-b"
                  style={{
                    borderBottomColor: 'rgba(231,229,228,0.7)',
                    background: '#FAFAF9',
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <GitCompare size={15} style={{ color: '#78716C' }} />
                      <Dialog.Title
                        className="font-mono font-semibold tracking-tight"
                        style={{ fontSize: 13, color: '#1C1917' }}
                      >
                        {transaction.id}
                      </Dialog.Title>

                      {/* Status pill */}
                      {isRejected && (
                        <motion.span
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                          style={{
                            background: 'rgba(225,29,72,0.08)',
                            color: '#E11D48',
                            border: '1px solid rgba(225,29,72,0.2)',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ background: '#E11D48' }}
                          />
                          Rejected · Drift
                        </motion.span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-0.5">
                      <Dialog.Description
                        className="font-mono text-stone-400"
                        style={{ fontSize: 11 }}
                      >
                        {transaction.buyer_id} → {transaction.seller_id}
                      </Dialog.Description>
                      <span className="text-stone-300">·</span>
                      <span className="font-mono text-stone-400" style={{ fontSize: 11 }}>
                        ${transaction.amount.toFixed(2)} at risk
                      </span>
                      {transaction.validation_time_ms && (
                        <>
                          <span className="text-stone-300">·</span>
                          <span
                            className="flex items-center gap-1 font-mono text-stone-400"
                            style={{ fontSize: 11 }}
                          >
                            <Clock size={9} />
                            {transaction.validation_time_ms}ms
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <Dialog.Close
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: '#A8A29E' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F5F5F4'
                      e.currentTarget.style.color = '#1C1917'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#A8A29E'
                    }}
                  >
                    <X size={15} />
                  </Dialog.Close>
                </div>

                {/* ── Task description ── */}
                <div
                  className="px-6 py-3 border-b flex items-start gap-2 flex-shrink-0"
                  style={{ borderBottomColor: 'rgba(231,229,228,0.5)', background: '#FAFAF9' }}
                >
                  <Info size={12} style={{ color: '#A8A29E', marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#78716C', lineHeight: 1.5 }}>
                    {transaction.task_description}
                  </p>
                </div>

                {/* ── Tabs ── */}
                <div
                  className="flex items-center border-b flex-shrink-0"
                  style={{ borderBottomColor: 'rgba(231,229,228,0.6)', background: '#FAFAF9' }}
                >
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="relative flex items-center gap-2 px-5 py-3 transition-colors outline-none"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: activeTab === tab.id ? '#1C1917' : '#78716C',
                        borderBottom: activeTab === tab.id
                          ? '2px solid #1C1917'
                          : '2px solid transparent',
                      }}
                    >
                      {tab.label}
                      {tab.badge !== null && tab.badge > 0 && (
                        <span
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                          style={{
                            background: tab.id === 'diff' || tab.id === 'trace' ? '#E11D48' : '#D97706',
                            color: '#fff',
                          }}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Tab Content ── */}
                <div className="flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="h-full"
                    >
                      {activeTab === 'diff' && (
                        <DiffViewer
                          expectedObj={transaction.expected_schema}
                          actualObj={transaction.actual_output}
                        />
                      )}

                      {activeTab === 'timeline' && (
                        <div className="p-6 overflow-y-auto h-full">
                          <TimelineDetailPanel
                            stages={transaction.timeline}
                            transactionId={transaction.id}
                          />
                        </div>
                      )}

                      {activeTab === 'trace' && (
                        <div className="p-6 overflow-y-auto h-full">
                          {transaction.rejection_reason ? (
                            <RejectionTrace reason={transaction.rejection_reason} />
                          ) : (
                            <div
                              className="flex items-center justify-center h-32 rounded-xl border border-dashed"
                              style={{ borderColor: 'rgba(231,229,228,0.8)', color: '#A8A29E' }}
                            >
                              <p style={{ fontSize: 13 }}>No validation errors recorded.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* ── Footer Actions ── */}
                <div
                  className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
                  style={{ borderTopColor: 'rgba(231,229,228,0.7)', background: '#FAFAF9' }}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySchema}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ color: '#78716C', background: 'transparent', border: '1px solid rgba(231,229,228,0.8)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F4' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      {copied ? <Check size={12} style={{ color: '#059669' }} /> : <Copy size={12} />}
                      Copy Expected Schema
                    </button>

                    <button
                      onClick={handleCopyCurl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ color: '#78716C', background: 'transparent', border: '1px solid rgba(231,229,228,0.8)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F4' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      Copy cURL
                    </button>
                  </div>

                  <button
                    onClick={handleReplay}
                    disabled={isReplaying}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    style={{ background: '#1C1917', color: '#FAFAF9' }}
                    onMouseEnter={(e) => { if (!isReplaying) e.currentTarget.style.background = '#292524' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#1C1917' }}
                  >
                    {isReplaying
                      ? <RotateCw size={12} className="animate-spin" />
                      : <Play size={12} />
                    }
                    Replay Transaction
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
