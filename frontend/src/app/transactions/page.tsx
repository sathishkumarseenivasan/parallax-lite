'use client'
/**
 * Transactions page — full ledger with sort / filter / pagination.
 * Uses the same AppShell as Dashboard.
 */
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Tabs from '@radix-ui/react-tabs'
import { AppShell }            from '@/components/layout/AppShell'
import { VaultLedger }         from '@/components/ledger/VaultLedger'
import { SettlementBreakdown } from '@/components/settlement/SettlementBreakdown'
import { ExecutionTrace }      from '@/components/trace/ExecutionTrace'
import { DiffInspector }       from '@/components/inspector/DiffInspector'
import { RightDrawer }         from '@/components/ledger/RightDrawer'
import { ErrorBoundary }       from '@/components/shared/ErrorBoundary'
import { MOCK_TRANSACTIONS }   from '@/lib/mock-pragmatic-data'
import type { PragmaticTx }    from '@/lib/mock-pragmatic-data'



import { useSearchParams } from 'next/navigation'
import { useStore } from '@/providers/useStore'
import { Suspense } from 'react'

function TransactionsContent() {
  const searchParams = useSearchParams()
  const txId = searchParams.get('id')
  const transactions = useStore(state => state.transactions)
  
  const [selected, setSelected] = useState<PragmaticTx | null>(() => {
    if (txId) {
      return transactions.find(t => t.id === txId) || null
    }
    return null
  })

  // Sync selected state if txId changes in URL
  useEffect(() => {
    if (txId) {
      const found = transactions.find(t => t.id === txId)
      if (found) setSelected(found)
    }
  }, [txId, transactions])

  return (
    <AppShell
      title="Transactions"
      subtitle="Full history of all agent-to-agent escrow transactions"
      noPad
    >
      <div className="relative flex h-full overflow-hidden">
        <div className="flex-1 min-w-0 overflow-y-auto p-6">
          {/* Summary bar */}
          <div className="flex items-center gap-6 mb-5 text-sm text-gray-500">
            <span>
              <span className="font-semibold text-gray-900">{transactions.length}</span> total transactions
            </span>
            <span className="text-gray-300">|</span>
            <span>
              <span className="font-semibold text-emerald-600">{transactions.filter(t=>t.status==='CLEARED').length}</span> cleared
            </span>
            <span className="text-gray-300">|</span>
            <span>
              <span className="font-semibold text-rose-600">{transactions.filter(t=>t.status==='REJECTED_DRIFT').length}</span> rejected
            </span>
            <span className="text-gray-300">|</span>
            <span>
              <span className="font-semibold text-amber-600">{transactions.filter(t=>t.status==='LOCKED').length}</span> locked
            </span>
            <span className="ml-auto text-xs text-gray-400">Click any row to inspect →</span>
          </div>

          <ErrorBoundary fallbackTitle="Transactions ledger failed to render">
            <VaultLedger
              transactions={transactions}
              onRowClick={tx => setSelected(prev => prev?.id === tx.id ? null : tx)}
              selectedId={selected?.id}
            />
          </ErrorBoundary>
        </div>

        <AnimatePresence>
          {selected && <RightDrawer tx={selected} onClose={() => setSelected(null)} />}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TransactionsContent />
    </Suspense>
  )
}
