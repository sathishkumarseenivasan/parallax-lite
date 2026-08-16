/**
 * StatusBadge — displays a transaction status with muted, professional colors.
 * Uses bg-*-50 backgrounds with text-*-700 — no neon, no bright colors.
 */
import { cn, statusClasses, statusLabel } from '@/lib/utils'
import type { TransactionStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: TransactionStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        statusClasses(status),
        className
      )}
    >
      {statusLabel(status)}
    </span>
  )
}
