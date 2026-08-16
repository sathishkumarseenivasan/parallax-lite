/**
 * Utility functions for the Parallax Lite frontend.
 * All formatting, copying, and display helpers live here.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, parseISO } from 'date-fns'
import type { TransactionStatus } from './types'

/**
 * Merge Tailwind class names, resolving conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a credit amount with 4 decimal places in monospace context.
 * Example: 42.5 → "42.5000"
 */
export function formatCredits(amount: number): string {
  if (!Number.isFinite(amount)) return '0.0000'
  return amount.toFixed(4)
}

/**
 * Format a number with comma separators for readability.
 * Example: 1234567 → "1,234,567"
 */
export function formatNumber(num: number): string {
  if (!Number.isFinite(num)) return '0'
  return num.toLocaleString('en-US')
}

/**
 * Format a currency amount with commas and 2 decimal places.
 * Example: 1234.5 → "$1,234.50"
 */
export function formatCurrency(amount: number, symbol = '$'): string {
  if (!Number.isFinite(amount)) return `${symbol}0.00`
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format a percentage (0.0 – 1.0) as e.g. "24.5%"
 */
export function formatPercent(rate: number): string {
  if (!Number.isFinite(rate)) return '0.0%'
  return `${(rate * 100).toFixed(1)}%`
}

/**
 * Convert an ISO datetime string to a relative time string.
 * Example: "2024-01-01T12:00:00Z" → "3 minutes ago"
 */
export function formatRelativeTime(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true })
  } catch {
    return isoString
  }
}

/**
 * Format an ISO datetime string to HH:MM:SS.
 */
export function formatTime(isoString: string): string {
  try {
    return parseISO(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return isoString
  }
}

/**
 * Truncate a UUID-style string for display.
 * Example: "abc123-def456-..." → "abc123…"
 */
export function truncateId(id: string, length = 8): string {
  if (!id) return '—'
  if (id.length <= length) return id
  return `${id.slice(0, length)}…`
}

/**
 * Escape special characters in a string for safe display.
 * Prevents XSS when rendering user-provided data.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Copy text to the clipboard. Returns true if successful.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Return the display label for a transaction status.
 */
export function statusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    PENDING: 'Pending',
    LOCKED: 'Locked',
    CLEARED: 'Cleared',
    REJECTED_DRIFT: 'Rejected',
    REFUNDED: 'Refunded',
  }
  return labels[status] ?? status
}

/**
 * Return Tailwind class names for a status badge.
 */
export function statusClasses(status: TransactionStatus): string {
  const map: Record<TransactionStatus, string> = {
    CLEARED:        'bg-emerald-50 text-emerald-700 border border-emerald-200',
    REJECTED_DRIFT: 'bg-rose-50 text-rose-700 border border-rose-200',
    LOCKED:         'bg-amber-50 text-amber-700 border border-amber-200',
    PENDING:        'bg-gray-50 text-gray-600 border border-gray-200',
    REFUNDED:       'bg-blue-50 text-blue-700 border border-blue-200',
  }
  return map[status] ?? 'bg-gray-50 text-gray-600 border border-gray-200'
}
