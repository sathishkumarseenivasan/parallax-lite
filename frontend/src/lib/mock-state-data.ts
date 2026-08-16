/**
 * mock-state-data.ts
 * Rich, multi-step mock data for the Parallax Protocol UI.
 *
 * The HEADLINE transaction (tx_semver_0x3b) represents an agent that
 * passed Escrow Lock and Schema Interception but FAILED at Semantic
 * Verification because it returned a `string` ("true") instead of
 * a `boolean` (true) for the `validated` field — a classic type-drift.
 */

export type LifecycleStage =
  | 'ESCROW_LOCKED'
  | 'SCHEMA_INTERCEPTED'
  | 'SEMANTIC_VERIFIED'
  | 'SETTLEMENT_CLEARED'

export type StageStatus = 'pending' | 'active' | 'cleared' | 'rejected'

export interface TimelineStage {
  id: LifecycleStage
  label: string
  shortLabel: string
  description: string
  status: StageStatus
  timestamp: string | null
  durationMs: number | null
}

export interface MockStateTransaction {
  id: string
  buyer_id: string
  seller_id: string
  task_description: string
  amount: number
  status: 'PENDING' | 'LOCKED' | 'CLEARED' | 'REJECTED_DRIFT' | 'REFUNDED'
  timeline: TimelineStage[]
  expected_schema: Record<string, unknown>
  actual_output: Record<string, unknown>
  rejection_reason: string | null
  validation_time_ms: number | null
  created_at: string
  updated_at: string
}

/* ─── The "Killer" Rejected Transaction ──────────────────────────────────── */
/**
 * Agent TX: Semantic Validation Failure
 * Agent "Helix-7" was asked to perform a regulatory compliance check.
 * The Pydantic schema expected `validated: bool`.
 * The agent returned `validated: "true"` (a string).
 * Parallax intercepted this at Semantic Verification — step 3 — and
 * blocked the $12.50 settlement, protecting the buyer.
 */
export const HEADLINE_REJECTED_TX: MockStateTransaction = {
  id: 'tx_semver_0x3b',
  buyer_id: 'agent_nexus_prime',
  seller_id: 'agent_helix_7',
  task_description: 'Perform regulatory compliance check on trade execution data for Q3 batch — validate against MiFID II schema and confirm all 47 fields are present and correctly typed.',
  amount: 12.50,
  status: 'REJECTED_DRIFT',
  validation_time_ms: 83,
  created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  updated_at: new Date(Date.now() - 1000 * 60 * 7 - 1000 * 17).toISOString(),
  rejection_reason: `ValidationError: 1 validation error for ComplianceCheckResult
validated
  Input should be a valid boolean, unable to interpret input [type=bool_parsing, input_value='true', input_type=str]
    For further information visit https://errors.pydantic.dev/2.8/v/bool_parsing
    
Field path: $.validated
Expected:   bool
Received:   str ("true")
Hint: The agent returned the string literal "true" instead of the JSON boolean \`true\`.
      This is a common LLM output formatting failure.`,
  timeline: [
    {
      id: 'ESCROW_LOCKED',
      label: 'Escrow Locked',
      shortLabel: 'Lock',
      description: '$12.50 held in Parallax escrow. Buyer funds frozen pending validation.',
      status: 'cleared',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      durationMs: 12,
    },
    {
      id: 'SCHEMA_INTERCEPTED',
      label: 'Schema Intercepted',
      shortLabel: 'Schema',
      description: 'Agent output intercepted by Parallax middleware. ComplianceCheckResult schema loaded.',
      status: 'cleared',
      timestamp: new Date(Date.now() - 1000 * 60 * 7 - 1000 * 48).toISOString(),
      durationMs: 31,
    },
    {
      id: 'SEMANTIC_VERIFIED',
      label: 'Semantic Verified',
      shortLabel: 'Verify',
      description: 'Type drift detected: `validated` received str, expected bool. Settlement blocked.',
      status: 'rejected',
      timestamp: new Date(Date.now() - 1000 * 60 * 7 - 1000 * 17).toISOString(),
      durationMs: 40,
    },
    {
      id: 'SETTLEMENT_CLEARED',
      label: 'Settlement Cleared',
      shortLabel: 'Settle',
      description: 'Unreachable — blocked by Semantic Verification failure.',
      status: 'pending',
      timestamp: null,
      durationMs: null,
    },
  ],
  expected_schema: {
    "$schema": "ComplianceCheckResult v2.3.1",
    "trade_id": "string",
    "validated": true,                        // ← bool
    "compliance_score": 0.97,                 // ← float 0.0–1.0
    "fields_checked": 47,                     // ← int
    "failed_fields": [],                      // ← string[]
    "jurisdiction": "EU_MIFID_II",            // ← Literal enum
    "timestamp_utc": "2026-08-14T14:00:00Z",  // ← ISO 8601 datetime
    "auditor_id": "parallax-validator-v3",    // ← string
  },
  actual_output: {
    "$schema": "ComplianceCheckResult v2.3.1",
    "trade_id": "trade_q3_batch_0441",
    "validated": "true",                      // ← ❌ STRING — should be bool
    "compliance_score": 0.97,
    "fields_checked": 47,
    "failed_fields": [],
    "jurisdiction": "EU_MIFID_II",
    "timestamp_utc": "2026-08-14T14:00:00Z",
    "auditor_id": "agent_helix_7",
  },
}

/* ─── Additional Transactions for the Vault Ledger ───────────────────────── */
export const MOCK_STATE_TRANSACTIONS: MockStateTransaction[] = [
  HEADLINE_REJECTED_TX,
  {
    id: 'tx_pricecheck_0x1a',
    buyer_id: 'agent_atlas',
    seller_id: 'agent_orion',
    task_description: 'Extract real-time pricing for 3 competitors from market data API',
    amount: 3.25,
    status: 'CLEARED',
    validation_time_ms: 54,
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 1 - 1000 * 46).toISOString(),
    rejection_reason: null,
    timeline: [
      { id: 'ESCROW_LOCKED',       label: 'Escrow Locked',       shortLabel: 'Lock',   description: '$3.25 held.', status: 'cleared', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), durationMs: 9 },
      { id: 'SCHEMA_INTERCEPTED',  label: 'Schema Intercepted',  shortLabel: 'Schema', description: 'PriceCheckResult schema loaded.', status: 'cleared', timestamp: new Date(Date.now() - 1000 * 60 * 1 - 1000 * 51).toISOString(), durationMs: 22 },
      { id: 'SEMANTIC_VERIFIED',   label: 'Semantic Verified',   shortLabel: 'Verify', description: 'All fields pass type validation.', status: 'cleared', timestamp: new Date(Date.now() - 1000 * 60 * 1 - 1000 * 29).toISOString(), durationMs: 23 },
      { id: 'SETTLEMENT_CLEARED',  label: 'Settlement Cleared',  shortLabel: 'Settle', description: '$3.25 released to agent_orion.', status: 'cleared', timestamp: new Date(Date.now() - 1000 * 60 * 1 - 1000 * 6).toISOString(), durationMs: null },
    ],
    expected_schema: { "product_name": "string", "price_usd": 0.0, "currency": "USD", "source_url": "string", "fetched_at": "ISO 8601" },
    actual_output:   { "product_name": "CyberGoggles Pro", "price_usd": 299.99, "currency": "USD", "source_url": "https://example.com/products/cg-pro", "fetched_at": "2026-08-14T14:10:00Z" },
  },
  {
    id: 'tx_sentiment_0x2c',
    buyer_id: 'agent_gemini_b',
    seller_id: 'agent_claude_s',
    task_description: 'Analyze Reddit/Twitter sentiment for $NVDA over last 72h',
    amount: 1.80,
    status: 'LOCKED',
    validation_time_ms: null,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    rejection_reason: null,
    timeline: [
      { id: 'ESCROW_LOCKED',       label: 'Escrow Locked',       shortLabel: 'Lock',   description: '$1.80 held in escrow.', status: 'cleared', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), durationMs: 11 },
      { id: 'SCHEMA_INTERCEPTED',  label: 'Schema Intercepted',  shortLabel: 'Schema', description: 'Awaiting agent output...', status: 'active',  timestamp: null, durationMs: null },
      { id: 'SEMANTIC_VERIFIED',   label: 'Semantic Verified',   shortLabel: 'Verify', description: 'Pending.', status: 'pending', timestamp: null, durationMs: null },
      { id: 'SETTLEMENT_CLEARED',  label: 'Settlement Cleared',  shortLabel: 'Settle', description: 'Pending.', status: 'pending', timestamp: null, durationMs: null },
    ],
    expected_schema: { "ticker": "string", "sentiment": "bullish|bearish|neutral", "confidence": 0.0, "post_count": 0, "sources": [] },
    actual_output:   {},
  },
  {
    id: 'tx_codegen_0x4d',
    buyer_id: 'agent_nexus_prime',
    seller_id: 'agent_helix_7',
    task_description: 'Generate comprehensive test suite for auth middleware — JWT validation + rate limiting',
    amount: 8.00,
    status: 'CLEARED',
    validation_time_ms: 67,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
    rejection_reason: null,
    timeline: [
      { id: 'ESCROW_LOCKED',       label: 'Escrow Locked',       shortLabel: 'Lock',   description: '$8.00 held.', status: 'cleared', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), durationMs: 14 },
      { id: 'SCHEMA_INTERCEPTED',  label: 'Schema Intercepted',  shortLabel: 'Schema', description: 'CodeGenResult schema loaded.', status: 'cleared', timestamp: new Date(Date.now() - 1000 * 60 * 44 - 1000 * 46).toISOString(), durationMs: 28 },
      { id: 'SEMANTIC_VERIFIED',   label: 'Semantic Verified',   shortLabel: 'Verify', description: 'All fields valid. 12 tests confirmed.', status: 'cleared', timestamp: new Date(Date.now() - 1000 * 60 * 44 - 1000 * 18).toISOString(), durationMs: 25 },
      { id: 'SETTLEMENT_CLEARED',  label: 'Settlement Cleared',  shortLabel: 'Settle', description: '$8.00 released.', status: 'cleared', timestamp: new Date(Date.now() - 1000 * 60 * 44).toISOString(), durationMs: null },
    ],
    expected_schema: { "language": "string", "framework": "string", "code": "string", "tests_count": 0, "coverage_pct": 0.0 },
    actual_output:   { "language": "TypeScript", "framework": "Jest", "code": "describe('AuthMiddleware', () => { /* 12 tests */ });", "tests_count": 12, "coverage_pct": 94.3 },
  },
  {
    id: 'tx_resume_0x5e',
    buyer_id: 'agent_apollo',
    seller_id: 'agent_spartan',
    task_description: 'Parse senior engineer resume into structured HR database format',
    amount: 0.90,
    status: 'REJECTED_DRIFT',
    validation_time_ms: 29,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 119 - 1000 * 31).toISOString(),
    rejection_reason: `ValidationError: 2 validation errors for ResumeData\nemail\n  Field required [type=missing]\nexperience_years\n  Input should be a valid integer [type=int_type, input_value='8+']`,
    timeline: [
      { id: 'ESCROW_LOCKED',       label: 'Escrow Locked',       shortLabel: 'Lock',   description: '$0.90 held.', status: 'cleared', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), durationMs: 8 },
      { id: 'SCHEMA_INTERCEPTED',  label: 'Schema Intercepted',  shortLabel: 'Schema', description: 'ResumeData schema loaded.', status: 'cleared', timestamp: new Date(Date.now() - 1000 * 60 * 119 - 1000 * 52).toISOString(), durationMs: 15 },
      { id: 'SEMANTIC_VERIFIED',   label: 'Semantic Verified',   shortLabel: 'Verify', description: '2 field errors: missing email, invalid experience_years type.', status: 'rejected', timestamp: new Date(Date.now() - 1000 * 60 * 119 - 1000 * 37).toISOString(), durationMs: 21 },
      { id: 'SETTLEMENT_CLEARED',  label: 'Settlement Cleared',  shortLabel: 'Settle', description: 'Blocked.', status: 'pending', timestamp: null, durationMs: null },
    ],
    expected_schema: { "name": "string", "email": "string", "experience_years": 0, "skills": [], "current_role": "string" },
    actual_output:   { "name": "Jordan Blake", "experience_years": "8+", "skills": ["Python", "Kubernetes", "Rust"], "current_role": "Staff Engineer" },
  },
]
