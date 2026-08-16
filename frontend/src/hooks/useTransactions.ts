/**
 * SWR hooks for data fetching with 3-second auto-refresh.
 * All hooks expose { data, isLoading, error, mutate } in a consistent shape.
 */
import useSWR from 'swr'
import type { Agent, Metrics, Transaction } from '@/lib/types'

const REFRESH_INTERVAL = 3000 // 3 seconds

// Generic fetcher — SWR requires a plain function
const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

// ─── useTransactions ─────────────────────────────────────────────────────────

interface UseTransactionsOptions {
  limit?: number
  status?: string
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const params = new URLSearchParams()
  if (options.limit) params.set('limit', String(options.limit))
  if (options.status) params.set('status', options.status)
  const qs = params.toString() ? `?${params.toString()}` : ''

  const { data, error, isLoading, mutate } = useSWR<Transaction[]>(
    `/api/transactions${qs}`,
    fetcher,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 1000,
    }
  )

  return {
    transactions: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

// ─── useMetrics ──────────────────────────────────────────────────────────────

export function useMetrics() {
  const { data, error, isLoading, mutate } = useSWR<Metrics>(
    '/api/metrics',
    fetcher,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 1000,
    }
  )

  return {
    metrics: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

// ─── useAgents ───────────────────────────────────────────────────────────────

export function useAgents() {
  const { data, error, isLoading, mutate } = useSWR<Agent[]>(
    '/api/agents',
    fetcher,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
    }
  )

  return {
    agents: data ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

// ─── useHealth ───────────────────────────────────────────────────────────────

export function useHealth() {
  const { data, error } = useSWR<import('@/lib/types').HealthResponse>(
    '/api/health',
    fetcher,
    { refreshInterval: 10_000 }
  )

  return {
    isHealthy: data?.status === 'ok',
    version: data?.version,
    mode: data?.mode,
    features: data?.features,
    isError: !!error,
  }
}
