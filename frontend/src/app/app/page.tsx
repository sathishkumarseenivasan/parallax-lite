'use client'
/**
 * Dashboard page — main overview with telemetry chart + vault ledger.
 * Layout handled by AppShell (sidebar + topbar).
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { TrendingUp, AlertCircle, Shield, Clock, Activity } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { AppShell }            from '@/components/layout/AppShell'
import { AgentTelemetry }      from '@/components/telemetry/AgentTelemetry'
import { SubmitTaskPanel }     from '@/components/dashboard/SubmitTaskPanel'
import { VaultLedger }         from '@/components/ledger/VaultLedger'
import { RightDrawer }         from '@/components/ledger/RightDrawer'
import { ErrorBoundary }       from '@/components/shared/ErrorBoundary'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import { MOCK_TRANSACTIONS }   from '@/lib/mock-pragmatic-data'
import type { PragmaticTx }    from '@/lib/mock-pragmatic-data'
import { formatCurrency }      from '@/lib/utils'
import type { Transaction }    from '@/lib/types'

/* ─── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub: string; color: string; icon: React.ElementType
}) {
  return (
    <div className="box px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <Icon size={15} style={{ color }} />
      </div>
      <p className="font-mono font-bold text-2xl" style={{ color, letterSpacing: '-0.02em' }}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}



import { useStore } from '@/providers/useStore'

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [selectedTx, setSelectedTx] = useState<PragmaticTx | null>(null)
  const transactions = useStore(state => state.transactions)

  const handleClose = useCallback(() => setSelectedTx(null), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedTx(null) }
    const openTxHandler = (e: CustomEvent) => setSelectedTx(e.detail)

    document.addEventListener('keydown', handler)
    window.addEventListener('open_tx', openTxHandler as EventListener)

    const ws = useStore.getState().connectWebSocket()
    return () => {
      document.removeEventListener('keydown', handler)
      window.removeEventListener('open_tx', openTxHandler as EventListener)
    }
  }, [])

  // Memoize expensive aggregate calculations
  const { cleared, rejected, saved, avgScore, avgLat } = useMemo(() => {
    const c = transactions.filter(t => t.status === 'CLEARED').length
    const r = transactions.filter(t => t.status === 'REJECTED_DRIFT').length
    const s = transactions.filter(t => t.status === 'REJECTED_DRIFT').reduce((acc, t) => acc + t.base_value, 0)
    const score = transactions.length > 0 ? Math.round(transactions.reduce((acc, t) => acc + t.semantic_score, 0) / transactions.length) : 0
    const lat = transactions.length > 0 ? Math.round(transactions.reduce((acc, t) => acc + t.latency_ms, 0) / transactions.length) : 0
    return { cleared: c, rejected: r, saved: s, avgScore: score, avgLat: lat }
  }, [transactions])

  const handleTaskSuccess = (backendTx: Transaction & { task_description?: string; expected_schema_name?: string }) => {
    const newTx: PragmaticTx = {
      id: (backendTx.id) || `tx_${Math.random().toString(36).substring(2, 10)}`,
      created_at: backendTx.created_at || new Date().toISOString(),
      buyer_id: backendTx.buyer_id || 'agent_alpha',
      seller_id: backendTx.seller_id || 'agent_beta',
      task: backendTx.task_description || 'Manual Task Submission',
      task_type: backendTx.expected_schema_name || 'Custom',
      schema_name: backendTx.expected_schema_name || 'Custom',
      status: backendTx.status || 'CLEARED',
      rejection_reason: backendTx.rejection_reason || undefined,
      base_value: backendTx.amount || 0,
      amount: backendTx.amount || 0,
      final_payout_usdc: backendTx.status === 'CLEARED' ? (backendTx.amount || 0) : 0,
      entropy_score: backendTx.status === 'CLEARED' ? 1.0 : 0.3,
      semantic_score: backendTx.status === 'CLEARED' ? 100 : 30,
      latency_ms: backendTx.validation_time_ms || 350,
      expected_schema: {},
      actual_output: {},
      expected_schema_json: '{\n  "info": "Custom schema"\n}',
      actual_output_json: backendTx.actual_output || '{}',
      trace: [
        {
          id: 'manual_submit',
          label: 'POST /api/transactions/submit',
          method: 'POST',
          path: '/api/transactions/submit',
          statusCode: 200,
          durationMs: backendTx.validation_time_ms || 350,
          color: 'indigo',
          headers: { 'X-Source': 'SubmitTaskPanel' }
        }
      ],
      http_trace: [],
      settlement: [
        { label: 'Base Task Value', description: 'Agreed contract price', value: backendTx.amount || 0, highlight: 'neutral' },
        { label: 'Schema Validation', description: 'Field presence & type check', value: 0, highlight: 'neutral' },
        { label: 'Semantic Accuracy (ΔS_entropy)', description: 'Entropy deviation penalty', value: backendTx.status === 'CLEARED' ? 0 : -((backendTx.amount || 0) * 0.7), highlight: backendTx.status === 'CLEARED' ? 'neutral' : 'rose' },
        { label: 'Latency Penalty (T_latency)', description: 'Response time over SLA threshold', value: 0, highlight: 'neutral' },
        { label: 'Final Settlement', description: 'Released to seller on-chain', value: backendTx.status === 'CLEARED' ? (backendTx.amount || 0) : ((backendTx.amount || 0) * 0.3), highlight: 'emerald' }
      ],
      settlement_breakdown: { base_value: backendTx.amount || 0, schema_validation_adjustment: 0, entropy_adjustment: 0, latency_adjustment: 0 }
    }
    useStore.getState().addTransaction(newTx)
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle="Real-time agent escrow monitoring and settlement analytics"
      noPad
    >
      <div className="flex flex-1 min-h-0 overflow-hidden h-full">
        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-5">
          <ErrorBoundary fallbackTitle="Onboarding checklist failed">
            <OnboardingChecklist />
          </ErrorBoundary>

          {/* Stat row */}
          <div className="grid grid-cols-5 gap-4">
            <StatCard label="Total TX"     value={String(transactions.length)} sub="all time"               color="#374151" icon={Activity}     />
            <StatCard label="Cleared"      value={String(cleared)}                  sub={`${transactions.length ? Math.round(cleared/transactions.length*100) : 0}% success`} color="#059669" icon={TrendingUp}  />
            <StatCard label="Rejected"     value={String(rejected)}                 sub="schema drift blocked"   color="#E11D48" icon={AlertCircle}  />
            <StatCard label="Funds Saved"  value={formatCurrency(saved)}            sub="buyer protected"        color="#D97706" icon={Shield}       />
            <StatCard label="Avg. Score"   value={`${avgScore}%`}                   sub={`avg ${avgLat}ms latency`} color="#4F46E5" icon={Clock}      />
          </div>

          {/* Telemetry and Submit Task */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <ErrorBoundary fallbackTitle="Telemetry chart failed to load">
                <AgentTelemetry />
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-1">
              <ErrorBoundary fallbackTitle="Submit panel failed to load">
                <SubmitTaskPanel onSuccess={handleTaskSuccess} />
              </ErrorBoundary>
            </div>
          </div>

          {/* Table */}
          <ErrorBoundary fallbackTitle="Transaction ledger failed to load">
            <VaultLedger
              transactions={transactions}
              onRowClick={tx => setSelectedTx(prev => prev?.id === tx.id ? null : tx)}
              selectedId={selectedTx?.id}
            />
          </ErrorBoundary>
        </div>

        {/* Drawer */}
        <AnimatePresence>
          {selectedTx && (
            <RightDrawer tx={selectedTx} onClose={handleClose} />
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
