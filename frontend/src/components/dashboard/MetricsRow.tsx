/**
 * MetricsRow — 4-card grid showing key dashboard metrics.
 * Uses muted colors and font-mono for numbers. No icons. No gradients.
 */
import { cn, formatCredits, formatPercent } from '@/lib/utils'
import type { Metrics } from '@/lib/types'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

interface MetricsRowProps {
  metrics: Metrics
}

interface MetricCardProps {
  label: string
  value: string
  subtext?: string
  valueClassName?: string
  id: string
}

function MetricCard({ label, value, subtext, valueClassName, id }: MetricCardProps) {
  return (
    <div
      id={id}
      className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm"
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p
        className={cn(
          'text-2xl font-mono font-semibold tabular-nums text-gray-900',
          valueClassName
        )}
      >
        {value}
      </p>
      {subtext && (
        <p className="text-xs text-gray-400 mt-1">{subtext}</p>
      )}
    </div>
  )
}

export function MetricsRow({ metrics }: MetricsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        id="metric-total"
        label="Total Transactions"
        value={String(metrics.total_transactions)}
        subtext={`${formatPercent(metrics.rejection_rate)} rejection rate`}
      />

      <MetricCard
        id="metric-cleared"
        label="Cleared"
        value={String(metrics.cleared_count)}
        valueClassName="text-emerald-600"
        subtext="Payments released"
      />

      <MetricCard
        id="metric-rejected"
        label="Rejected (Drift)"
        value={String(metrics.rejected_count)}
        valueClassName="text-rose-600"
        subtext="Semantic drift caught"
      />

      <MetricCard
        id="metric-funds-saved"
        label="Funds Saved"
        value={`${formatCredits(metrics.total_funds_saved)} cr`}
        valueClassName="text-emerald-600"
        subtext="Prevented waste from bad outputs"
      />
    </div>
  )
}

export function MetricsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <LoadingSkeleton className="h-3 w-24 mb-3" />
          <LoadingSkeleton className="h-7 w-20 mb-1" />
          <LoadingSkeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}
