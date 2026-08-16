'use client'
/**
 * SettlementBreakdown — Stripe-style invoice breakdown for a transaction.
 * Calculates final settlement and provides clipboard copy.
 */
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { PragmaticTx } from '@/lib/mock-pragmatic-data'

interface Props { tx: PragmaticTx }

export function SettlementBreakdown({ tx }: Props) {
  const [copied, setCopied] = useState(false)

  const lines = tx.settlement
  const finalLine = lines[lines.length - 1]
  const adjustments = lines.slice(1, -1)

  const handleCopy = async () => {
    const text = [
      `Settlement Breakdown — ${tx.id}`,
      '═'.repeat(44),
      ...lines.slice(0, -1).map(l =>
        `${l.label.padEnd(36)} ${l.value >= 0 ? ' ' : ''}${l.value.toFixed(4)} USDC`
      ),
      '─'.repeat(44),
      `Final Settlement                      ${finalLine.value.toFixed(4)} USDC`,
      '',
      `Schema:  ${tx.schema_name}`,
      `Score:   ${tx.semantic_score}%`,
      `Latency: ${tx.latency_ms}ms`,
      `Status:  ${tx.status}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Settlement Breakdown</h3>
        <button onClick={handleCopy} className="btn btn-default text-xs">
          {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy Breakdown'}
        </button>
      </div>

      {/* Breakdown lines */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {/* Base value */}
        <LineRow
          label="Base Task Value"
          description="Agreed contract price"
          value={tx.base_value}
          isMono
        />

        {/* Divider */}
        <div className="pt-2 pb-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Adjustments</p>
        </div>

        {adjustments.map((line) => (
          <LineRow
            key={line.label}
            label={line.label}
            description={line.description}
            value={line.value}
            highlight={line.highlight}
            showSign
          />
        ))}

        {/* Divider */}
        <div className="border-t border-gray-200 my-3" />

        {/* Final */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">Final Settlement</p>
            <p className="text-xs text-gray-500">Released to seller on-chain</p>
          </div>
          <div className="text-right">
            <p
              className="font-mono font-bold"
              style={{ fontSize: 18, color: tx.status === 'CLEARED' ? '#059669' : '#E11D48', letterSpacing: '-0.02em' }}
            >
              {finalLine.value.toFixed(4)}
            </p>
            <p className="text-xs text-gray-400 font-mono">USDC</p>
          </div>
        </div>
      </div>

      {/* Score / Latency metadata */}
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 grid grid-cols-3 gap-3">
        {[
          { label: 'Semantic Score', value: `${tx.semantic_score}%`, mono: true,
            color: tx.semantic_score >= 90 ? '#059669' : tx.semantic_score >= 75 ? '#D97706' : '#E11D48' },
          { label: 'Latency', value: `${tx.latency_ms}ms`, mono: true,
            color: tx.latency_ms < 1000 ? '#059669' : tx.latency_ms < 2000 ? '#D97706' : '#E11D48' },
          { label: 'Schema', value: tx.schema_name, mono: false, color: '#4F46E5' },
        ].map(m => (
          <div key={m.label}>
            <p className="text-xs text-gray-400 mb-0.5">{m.label}</p>
            <p
              className={m.mono ? 'font-mono text-xs font-semibold' : 'text-xs font-semibold'}
              style={{ color: m.color }}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Sub-component ─────────────────────────────────────────────────────── */
function LineRow({
  label, description, value, highlight, showSign = false, isMono = false,
}: {
  label: string
  description: string
  value: number
  highlight?: 'rose' | 'emerald' | 'neutral'
  showSign?: boolean
  isMono?: boolean
}) {
  const valueColor =
    highlight === 'rose'   ? '#E11D48' :
    highlight === 'emerald' ? '#059669' : '#374151'

  const displayVal = `${showSign && value > 0 ? '+' : ''}${value.toFixed(4)} USDC`

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-xs font-medium text-gray-700 truncate">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <p className="font-mono text-xs font-medium flex-shrink-0" style={{ color: valueColor }}>
        {displayVal}
      </p>
    </div>
  )
}
