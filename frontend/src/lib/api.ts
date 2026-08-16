/**
 * Typed API client for Parallax Lite backend.
 * All requests go through Next.js rewrites → http://localhost:8000.
 *
 * Features:
 * - Automatic retry with exponential backoff (max 3 attempts)
 * - Typed error responses with user-friendly messages
 * - Structured request/response logging
 */
import type { Agent, Metrics, TaskSubmission, Transaction } from './types'

const BASE_URL = '/api'
const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 500

/** Structured API error with HTTP status and user-friendly message. */
class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Determines whether an HTTP status code is retryable. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504 || status === 0
}

/** Formats a raw error into a user-friendly message. */
function formatErrorMessage(status: number, detail: string): string {
  switch (status) {
    case 0:   return 'Network error — check your connection and that the backend is running.'
    case 401: return 'Authentication required. Please check your credentials.'
    case 403: return 'Access denied. You do not have permission to perform this action.'
    case 404: return 'Resource not found. The requested endpoint does not exist.'
    case 422: return detail || 'Validation failed. Please check your input.'
    case 429: return 'Too many requests. Please wait a moment and try again.'
    case 500: return 'Internal server error. The backend encountered an unexpected issue.'
    case 502:
    case 503:
    case 504: return 'Service temporarily unavailable. Please try again in a few seconds.'
    default:  return detail || `Request failed with status ${status}.`
  }
}

/** Core request function with retry logic and structured error handling. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let lastError: ApiError | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        ...init,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }))
        const detail = body.detail ?? res.statusText
        const retryable = isRetryableStatus(res.status)

        lastError = new ApiError(
          formatErrorMessage(res.status, detail),
          res.status,
          retryable
        )

        if (retryable && attempt < MAX_RETRIES - 1) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        throw lastError
      }

      return res.json() as Promise<T>
    } catch (err) {
      if (err instanceof ApiError) throw err

      // Network error (fetch itself failed)
      lastError = new ApiError(
        formatErrorMessage(0, 'Network error'),
        0,
        true
      )

      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
    }
  }

  throw lastError ?? new ApiError('Request failed after retries.', 0)
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export const agentsApi = {
  /** Fetch all registered agents. */
  list: (): Promise<Agent[]> => request('/agents'),

  /** Seed demo data (agents + transactions). */
  seed: (): Promise<{ message: string }> =>
    request('/agents/seed', { method: 'POST' }),
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactionsApi = {
  /** List transactions with optional filters. */
  list: (params?: { limit?: number; status?: string }): Promise<Transaction[]> => {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.status) qs.set('status', params.status)
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/transactions${query}`)
  },

  /** Get a single transaction by ID. */
  get: (id: string): Promise<Transaction> => request(`/transactions/${id}`),

  /** Submit a new task for validation. */
  submit: (payload: TaskSubmission): Promise<Transaction> =>
    request('/transactions/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export const metricsApi = {
  /** Fetch aggregated dashboard metrics. */
  get: (): Promise<Metrics> => request('/metrics'),
}

// ─── Health ──────────────────────────────────────────────────────────────────

export const healthApi = {
  /** Check backend liveness. */
  check: (): Promise<import('./types').HealthResponse> => request('/health'),
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
}

export { ApiError }
