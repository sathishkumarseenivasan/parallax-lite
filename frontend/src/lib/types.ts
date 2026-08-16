/**
 * Shared TypeScript types matching the backend Pydantic schemas.
 * These are the single source of truth for all API response shapes.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TransactionStatus =
  | 'PENDING'
  | 'LOCKED'
  | 'CLEARED'
  | 'REJECTED_DRIFT'
  | 'REFUNDED'

export type AgentRole = 'buyer' | 'seller' | 'validator'

// ─── Agent ────────────────────────────────────────────────────────────────────

export interface Agent {
  id: string
  name: string
  role: AgentRole
  balance: number
  total_transactions: number
  total_rejected: number
  created_at: string // ISO datetime
  trust_score?: number
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface Transaction {
  id: string
  buyer_id: string
  seller_id: string
  amount: number
  status: TransactionStatus
  expected_schema: string
  actual_output: string | null
  rejection_reason: string | null
  validation_time_ms: number | null
  entropy_score: number | null
  verdict_breakdown: Record<string, unknown> | null
  parent_tx_id: string | null
  seq: number
  created_at: string
  updated_at: string
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface Metrics {
  total_transactions: number
  cleared_count: number
  rejected_count: number
  locked_count: number
  total_funds_saved: number
  total_volume: number
  rejection_rate: number
}

// ─── Task Submission ─────────────────────────────────────────────────────────

export interface TaskSubmission {
  buyer_id: string
  seller_id: string
  task_description: string
  expected_schema_name: 'PriceCheck' | 'DataExtraction' | 'CodeGeneration'
  payment_amount: number
  simulated_output: string
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  code: string
  message: string
  docs: string
}

// ─── Chart Data ──────────────────────────────────────────────────────────────

export interface PieChartDatum {
  name: string
  value: number
  color: string
}

export interface FeaturesResponse {
  public_endpoints: boolean
  rate_limits: boolean
  machine_onboarding: boolean
  seed: boolean
  simulate: boolean
}

export interface HealthResponse {
  status: string
  version: string
  database: string
  mode: string
  features: FeaturesResponse
}
