/**
 * EmptyState — shown when the transactions table has no data.
 * Clean, centered, minimal. No emoji. Lucide Inbox icon.
 */
import { Inbox } from 'lucide-react'

export function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6"
      role="status"
      aria-label="No transactions"
    >
      <Inbox
        size={40}
        className="text-gray-300 mb-3"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-gray-900 mb-1">
        No transactions yet
      </p>
      <p className="text-xs text-gray-400 text-center max-w-xs">
        No drift in the last 24h — your swarm is healthy
      </p>
    </div>
  )
}
