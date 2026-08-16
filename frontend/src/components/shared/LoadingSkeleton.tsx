/**
 * LoadingSkeleton — production-grade skeleton with shimmer animation.
 * Matches the exact layout of actual content for a polished loading state.
 *
 * Usage:
 *   <LoadingSkeleton className="h-4 w-32" />
 *   <LoadingSkeleton className="h-8 w-full" variant="rounded" />
 */
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  /** Shape variant: default rounded-sm, "rounded" for rounded-lg, "circle" for full circle */
  variant?: 'default' | 'rounded' | 'circle'
  style?: React.CSSProperties
}

export function LoadingSkeleton({ className, variant = 'default', style }: LoadingSkeletonProps) {
  const shapeClass =
    variant === 'circle'  ? 'rounded-full' :
    variant === 'rounded' ? 'rounded-lg'   : 'rounded'

  return (
    <div
      className={cn(
        'skeleton-shimmer',
        shapeClass,
        className
      )}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  )
}

/**
 * SkeletonText — renders multiple lines of skeleton text.
 * Line widths vary to simulate real text content.
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-2/3']
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          className={cn('h-3', widths[i % widths.length])}
        />
      ))}
    </div>
  )
}

/**
 * StatCardSkeleton — skeleton for stat/metric cards.
 */
export function StatCardSkeleton() {
  return (
    <div className="box px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <LoadingSkeleton className="h-3 w-20" />
        <LoadingSkeleton className="h-4 w-4" variant="rounded" />
      </div>
      <LoadingSkeleton className="h-7 w-16 mb-1" />
      <LoadingSkeleton className="h-3 w-24" />
    </div>
  )
}

/**
 * ChartSkeleton — skeleton matching the AgentTelemetry chart layout.
 */
export function ChartSkeleton() {
  return (
    <div className="box">
      <div className="box-header">
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="h-6 w-24" variant="rounded" />
      </div>
      <div className="p-4" style={{ height: 220 }}>
        <div className="h-full flex items-end gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <LoadingSkeleton
              key={i}
              className="flex-1"
              style={{ height: `${30 + ((i * 17) % 60)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * TableRowSkeleton — skeleton for a single dense-table row.
 */
export function TableRowSkeleton({ columns = 9 }: { columns?: number }) {
  const widths = [100, 60, 60, 70, 80, 50, 55, 65, 55]
  return (
    <tr className="border-b border-gray-100">
      <td style={{ width: 40, textAlign: 'center' }} className="px-2 py-2.5">
        <LoadingSkeleton className="h-4 w-4 mx-auto" variant="rounded" />
      </td>
      {Array.from({ length: Math.min(columns, widths.length) }).map((_, i) => (
        <td key={i} className="px-3 py-2.5">
          <LoadingSkeleton className="h-3.5" style={{ width: widths[i] }} />
        </td>
      ))}
    </tr>
  )
}
