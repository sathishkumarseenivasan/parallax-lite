'use client'
/**
 * State View — lifecycle observability for agent transactions.
 * Same shell as Dashboard. Replaces the old standalone page.
 */
import { useState } from 'react'
import { AlertTriangle, TrendingUp, Shield, Clock, GitCompare } from 'lucide-react'
import { AppShell }        from '@/components/layout/AppShell'
import { VaultLedger }     from '@/components/ledger/VaultLedger'
import { DiffInspector }   from '@/components/inspector/DiffInspector'
import { ErrorBoundary }   from '@/components/shared/ErrorBoundary'
import { MOCK_TRANSACTIONS } from '@/lib/mock-pragmatic-data'
import type { PragmaticTx }  from '@/lib/mock-pragmatic-data'

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="box px-4 py-3.5">
      <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
      <p className="font-mono font-bold text-2xl" style={{ color, letterSpacing: '-0.02em' }}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

import { useStore } from '@/providers/useStore'

export default function StateViewPage() {
  const [driftTx, setDriftTx] = useState<PragmaticTx | null>(null)
  const transactions = useStore(state => state.transactions)

  const cleared  = transactions.filter(t => t.status === 'CLEARED').length
  const rejected = transactions.filter(t => t.status === 'REJECTED_DRIFT').length
  const saved    = transactions.filter(t => t.status === 'REJECTED_DRIFT').reduce((s, t) => s + t.base_value, 0)
  const avgScore = transactions.length ? Math.round(transactions.reduce((s, t) => s + t.semantic_score, 0) / transactions.length) : 0

  // Find first REJECTED_DRIFT for the incident panel
  const headlineTx = transactions.find(t => t.status === 'REJECTED_DRIFT')

  return (
    <AppShell
      title="State View"
      subtitle="Semantic validation lifecycle — track what passed, what drifted, and why"
    >
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Cleared"     value={String(cleared)}           sub={`${Math.round(cleared/MOCK_TRANSACTIONS.length*100)}% pass rate`} color="#059669" />
          <StatCard label="Rejected"    value={String(rejected)}          sub="schema drift blocked"       color="#E11D48" />
          <StatCard label="Funds Saved" value={`$${saved.toFixed(2)}`}    sub="buyer escrow protected"     color="#D97706" />
          <StatCard label="Avg. Score"  value={`${avgScore}%`}            sub="mean semantic confidence"   color="#4F46E5" />
        </div>

        {/* Active Incident */}
        {headlineTx && (
          <div className="box overflow-hidden">
            <div
              className="flex items-start justify-between px-5 py-4 border-b"
              style={{ background: '#FEF2F2', borderBottomColor: '#FECACA' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: '#FEE2E2' }}
                >
                  <AlertTriangle size={16} style={{ color: '#E11D48' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">Active Incident</span>
                    <span className="badge" style={{ background: '#FEF2F2', color: '#E11D48', borderColor: '#FECACA', fontSize: 11 }}>
                      REJECTED_DRIFT
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{headlineTx.id}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{headlineTx.task}</p>
                  {headlineTx.rejection_reason && (
                    <pre className="mt-2 text-xs font-mono text-red-700 bg-rose-50 border border-rose-200 rounded p-2 whitespace-pre-wrap">
                      {headlineTx.rejection_reason}
                    </pre>
                  )}
                </div>
              </div>

              <button
                onClick={() => setDriftTx(headlineTx)}
                className="btn btn-default flex-shrink-0 ml-4 text-sm"
              >
                <GitCompare size={14} />
                Open Diff Inspector
              </button>
            </div>

            {/* Key metrics for the incident */}
            <div className="grid grid-cols-4 divide-x divide-gray-200">
              {[
                { label: 'Schema',        value: headlineTx.schema_name,              color: '#4F46E5' },
                { label: 'Semantic Score',value: `${headlineTx.semantic_score}%`,     color: '#E11D48' },
                { label: 'Latency',       value: `${headlineTx.latency_ms}ms`,        color: '#D97706' },
                { label: 'Base Value',    value: `${headlineTx.base_value.toFixed(4)} USDC`, color: '#374151' },
              ].map(m => (
                <div key={m.label} className="px-5 py-3">
                  <p className="text-xs text-gray-500 mb-0.5">{m.label}</p>
                  <p className="font-mono text-sm font-semibold" style={{ color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full ledger */}
        <ErrorBoundary fallbackTitle="Ledger failed to render">
          <VaultLedger
            transactions={transactions}
            onRowClick={tx => {
              if (tx.status === 'REJECTED_DRIFT') setDriftTx(prev => prev?.id === tx.id ? null : tx)
            }}
            selectedId={driftTx?.id}
          />
        </ErrorBoundary>

        <p className="text-xs text-gray-400">
          Tip: Click any <span className="badge-rejected badge text-xs px-1.5">Rejected</span> row to open the Diff Inspector for that transaction.
        </p>
      </div>

      {/* Diff inspector overlay */}
      {driftTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDriftTx(null)}
        >
          <div
            className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col"
            style={{ width: 900, height: '80vh', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Diff Inspector — {driftTx.id}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Schema: {driftTx.schema_name} · Click outside to close</p>
              </div>
              <button onClick={() => setDriftTx(null)} className="btn btn-ghost text-sm">Close</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ErrorBoundary fallbackTitle="Diff Inspector failed to render">
                <DiffInspector tx={driftTx} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
