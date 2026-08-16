'use client'
/**
 * Agents page — registry of all active buyer/seller agents.
 * Uses AppShell for consistent shell with Dashboard.
 */
import { AppShell }    from '@/components/layout/AppShell'
import { useAgents }   from '@/hooks/useTransactions'
import { Sparkline }   from '@/components/telemetry/Sparkline'
import { Users, TrendingUp, XCircle, Activity, AlertCircle } from 'lucide-react'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'
import type { Agent, Transaction } from '@/lib/types'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AgentWalletCard } from '@/components/dashboard/AgentWalletCard'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { useStore } from '@/providers/useStore'
import { NetworkTopography } from '@/components/network/NetworkTopography'

function AgentRow({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const isBuyer = agent.role === 'buyer'
  const trustScore = agent.trust_score ?? 0;
  const scoreColor = trustScore >= 80 ? '#059669' : trustScore >= 60 ? '#D97706' : '#E11D48'

  // Deterministic mock trends
  const volTrend = Array.from({length: 15}, (_, i) => 20 + (agent.id.charCodeAt(i % agent.id.length) % 30) + (i * 2))
  const latTrend = Array.from({length: 15}, (_, i) => Math.max(50, 300 - (agent.id.charCodeAt(i % agent.id.length) % 100) - (i * 10)))

  return (
    <tr 
      onClick={onClick}
      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: isBuyer ? '#4F46E5' : '#059669' }}
          >
            {agent.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{agent.name ?? agent.id}</p>
            <p className="font-mono text-xs text-gray-400">{agent.id}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span
          className="badge text-xs capitalize"
          style={
            isBuyer
              ? { background: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE' }
              : { background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }
          }
        >
          {agent.role}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className="font-mono text-sm font-medium text-gray-900">
          {Number(agent.balance ?? 0).toFixed(4)}
        </span>
        <span className="text-xs text-gray-400 ml-1">USDC</span>
      </td>
      <td className="px-5 py-3.5">
        <span className="font-mono text-sm text-gray-700">{agent.total_transactions ?? 0}</span>
      </td>
      <td className="px-5 py-3.5 w-32">
        <Sparkline data={volTrend} color="#4F46E5" fillOpacity={0.05} />
      </td>
      <td className="px-5 py-3.5 w-32">
        <Sparkline data={latTrend} color={latTrend[14] > 200 ? '#E11D48' : '#059669'} fillOpacity={0.05} />
      </td>
      <td className="px-5 py-3.5">
        <span className="font-mono text-sm" style={{ color: agent.total_rejected > 0 ? '#E11D48' : '#059669' }}>
          {agent.total_rejected ?? 0}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <TrustScoreBadge score={trustScore} />
      </td>
    </tr>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[1,2,3,4,5,6,7,8].map(i => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 skeleton-shimmer rounded" style={{ width: `${40 + (i * 7) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function AgentsPage() {
  const { agents, isLoading, isError } = useAgents()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const allTx = useStore(state => state.transactions)

  return (
    <AppShell title="Agents" subtitle="Registered buyer and seller agents in the Parallax network">
      <div className="relative flex h-full overflow-hidden">
        <div className="flex-1 min-w-0 overflow-y-auto space-y-5 pb-10 pr-2">

          {/* Error state */}
          {isError && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-md">
              <AlertCircle size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">Could not load agents</p>
                <p className="text-sm text-rose-600 mt-0.5">
                  Backend may be offline. Running on demo mode — no live agent data available.
                </p>
              </div>
            </div>
          )}

          {/* Summary stat cards */}
          {!isLoading && agents.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Agents',    value: agents.length,                                                             color: '#374151', icon: Users },
                { label: 'Buyers',          value: agents.filter(a=>a.role==='buyer').length,                                 color: '#4F46E5', icon: Activity },
                { label: 'Sellers',         value: agents.filter(a=>a.role==='seller').length,                                color: '#059669', icon: TrendingUp },
                { label: 'High Rejection',  value: agents.filter(a=>(a.total_rejected/Math.max(a.total_transactions,1))>0.3).length, color: '#E11D48', icon: XCircle },
              ].map(s => (
                <div key={s.label} className="box px-4 py-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 font-medium">{s.label}</span>
                    <s.icon size={15} style={{ color: s.color }} />
                  </div>
                  <p className="font-mono font-bold text-2xl" style={{ color: s.color }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!isLoading && agents.length > 0 && (
            <div className="mt-4">
              <NetworkTopography agents={agents as any} />
            </div>
          )}

          {/* Agent table */}
          <div className="box overflow-hidden mt-5">
            <div className="box-header">
              <h2 className="text-sm font-semibold text-gray-900">Agent Registry</h2>
              <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200">
                {isLoading ? '…' : agents.length} agents
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="dense-table">
                <thead>
                  <tr>
                    {['Agent', 'Role', 'Balance', 'Total TX', 'Volume (7D)', 'Latency (ms)', 'Rejected', 'Trust Score'].map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <>{[1,2,3,4].map(i => <SkeletonRow key={i} />)}</>
                  ) : agents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-sm text-gray-400">
                        No agents found. Run <code className="font-mono bg-gray-100 px-1 rounded">python -m app.seed_data</code> to create demo agents.
                      </td>
                    </tr>
                  ) : (
                    [...agents].sort((a, b) => (b.trust_score ?? 0) - (a.trust_score ?? 0)).map(agent => (
                      <AgentRow 
                        key={agent.id} 
                        agent={agent} 
                        onClick={() => setSelectedAgent(agent)} 
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedAgent && (
            <motion.div
              key="agent-profile"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.9 }}
              className="flex flex-col border-l border-gray-200 bg-gray-50/50 overflow-hidden flex-shrink-0 absolute right-0 top-0 bottom-0 z-[50] shadow-2xl w-[800px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Agent Profile</h2>
                  <p className="text-sm text-gray-500 font-mono mt-0.5">{selectedAgent.id}</p>
                </div>
                <button onClick={() => setSelectedAgent(null)} className="btn btn-ghost p-2" aria-label="Close">
                  <XCircle size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AgentWalletCard agent={selectedAgent} />
                <TransactionTable 
                  transactions={allTx.filter(t => t.buyer_id === selectedAgent.id || t.seller_id === selectedAgent.id).slice(0, 50) as unknown as Transaction[]} 
                  isLoading={false} 
                  isError={false} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
