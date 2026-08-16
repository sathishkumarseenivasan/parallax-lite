/**
 * DriftAlertLog — scrollable validation event log.
 * Terminal-style log with timestamps, agent IDs, and rejection reasons.
 */
import { formatTime, truncateId, formatCredits } from '@/lib/utils'
import type { Transaction } from '@/lib/types'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { cn } from '@/lib/utils'

interface DriftAlertLogProps {
  transactions: Transaction[]
  isLoading: boolean
}

function LogEntry({ tx }: { tx: Transaction }) {
  const isRejected = tx.status === 'REJECTED_DRIFT'
  const isCleared = tx.status === 'CLEARED'

  return (
    <div
      id={`log-${tx.id.slice(0, 6)}`}
      className={cn(
        'flex items-start gap-2.5 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors px-4',
        'animate-fade-in'
      )}
    >
      {/* Status dot */}
      <span
        className={cn(
          'inline-block w-2 h-2 rounded-full mt-1 flex-shrink-0',
          isRejected ? 'bg-rose-500' : isCleared ? 'bg-emerald-500' : 'bg-amber-400'
        )}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          {/* Timestamp */}
          <span className="font-mono text-[10px] text-gray-400 flex-shrink-0">
            [{formatTime(tx.created_at)}]
          </span>

          {/* TX ID */}
          <span className="font-mono text-xs font-medium text-gray-600">
            TX_{truncateId(tx.id, 6)}
          </span>

          {/* Outcome */}
          {isRejected ? (
            <span className="text-[10px] text-rose-600 font-bold tracking-wider uppercase">REJECTED</span>
          ) : isCleared ? (
            <span className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase">CLEARED</span>
          ) : (
            <span className="text-[10px] text-amber-600 font-bold tracking-wider uppercase">LOCKED</span>
          )}

          {/* Amount */}
          <span className="font-mono text-xs text-gray-500 font-medium ml-auto">
            {formatCredits(tx.amount)} cr
          </span>
        </div>

        {/* Rejection reason */}
        {isRejected && tx.rejection_reason && (
          <p className="text-xs text-rose-500/90 mt-1 font-mono leading-relaxed truncate bg-rose-50/50 px-2 py-1 rounded">
            {tx.rejection_reason.length > 90
              ? `${tx.rejection_reason.slice(0, 90)}…`
              : tx.rejection_reason}
          </p>
        )}

        {/* Cleared message */}
        {isCleared && (
          <p className="text-xs text-gray-400 mt-1">
            <span className="font-mono">{formatCredits(tx.amount)}</span> credits released to seller
          </p>
        )}
      </div>
    </div>
  )
}

export function DriftAlertLog({ transactions, isLoading }: DriftAlertLogProps) {
  // Show most recent 30 entries, prioritizing rejected ones
  const recent = transactions.slice(0, 30)

  return (
    <div className="card-premium h-full flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Validation Log</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Live stream of transaction events
          </p>
        </div>
      </div>

      <div
        className="overflow-y-auto scrollbar-thin max-h-64"
        role="log"
        aria-label="Validation log"
        aria-live="polite"
      >
        <div className="px-4 py-2">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="py-2 border-b border-gray-100 last:border-0">
                <LoadingSkeleton className="h-3 w-full mb-1.5" />
                <LoadingSkeleton className="h-3 w-3/4" />
              </div>
            ))
          ) : recent.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">
              No drift in the last 24h — your swarm is healthy
            </p>
          ) : (
            recent.map((tx) => <LogEntry key={tx.id} tx={tx} />)
          )}
        </div>
      </div>
    </div>
  )
}
