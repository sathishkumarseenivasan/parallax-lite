/**
 * AgentWalletCard — shows agent balance and statistics.
 * Two cards side-by-side: buyer (indigo accent) and seller (emerald accent).
 */
import { cn, formatCredits } from '@/lib/utils'
import type { Agent } from '@/lib/types'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'

interface AgentWalletCardProps {
  agent: Agent
}

function RoleBadge({ role }: { role: Agent['role'] }) {
  const styles: Record<string, string> = {
    buyer:     'bg-indigo-50 text-indigo-700 border-indigo-200/50',
    seller:    'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    validator: 'bg-purple-50 text-purple-700 border-purple-200/50',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase border',
        styles[role] ?? 'bg-gray-50 text-gray-600 border-gray-200/50'
      )}
    >
      {role}
    </span>
  )
}

export function AgentWalletCard({ agent }: AgentWalletCardProps) {
  const isbuyer = agent.role === 'buyer'
  const accentColor = isbuyer ? '#4F46E5' : '#059669' // indigo-600 / emerald-600

  return (
    <div
      className="card-premium h-full flex flex-col p-6"
      style={{ borderTop: `3px solid ${accentColor}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-900 tracking-tight">{agent.name}</span>
        <div className="flex items-center gap-2">
          {agent.role === 'seller' && (
            <TrustScoreBadge score={agent.trust_score} />
          )}
          <RoleBadge role={agent.role} />
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4 flex-1">
        <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-widest">
          Balance
        </p>
        <p
          className={cn(
            'text-3xl font-mono font-bold tabular-nums tracking-tighter',
            isbuyer ? 'text-indigo-600' : 'text-emerald-600'
          )}
        >
          {formatCredits(agent.balance)}
          <span className="text-lg font-medium text-gray-400 ml-1 tracking-tight">cr</span>
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-6 pt-4 border-t border-gray-100">
        <div>
          <p className="text-lg font-mono font-semibold text-gray-900 tracking-tight">
            {agent.total_transactions}
          </p>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Transactions</p>
        </div>
        {agent.total_rejected > 0 && (
          <div>
            <p className="text-lg font-mono font-semibold text-rose-600 tracking-tight">
              {agent.total_rejected}
            </p>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Rejected</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function AgentWalletCardSkeleton() {
  return (
    <div className="card-premium h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <LoadingSkeleton className="h-4 w-28" />
        <LoadingSkeleton className="h-5 w-16 rounded-full" />
      </div>
      <LoadingSkeleton className="h-8 w-40 mb-1" />
      <LoadingSkeleton className="h-3 w-16" />
      <div className="flex gap-4 pt-4 border-t border-gray-100 mt-auto">
        <div>
          <LoadingSkeleton className="h-5 w-10 mb-1" />
          <LoadingSkeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}
