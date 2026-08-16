/**
 * mock-pragmatic-data.ts
 * Strict-typed, pre-computed mock data for Parallax Protocol.
 * All financials are pre-calculated — zero runtime math on the frontend.
 */

/* ─── Types ────────────────────────────────────────────────────────────────── */

export type TxStatus = 'CLEARED' | 'REJECTED_DRIFT' | 'PARTIAL_PAYOUT' | 'LOCKED' | 'PENDING' | 'REFUNDED' | 'DISPUTED'

export interface TraceStep {
  id:          string
  label:       string
  method?:     string
  path?:       string
  statusCode?: number
  durationMs:  number
  color:       'gray' | 'amber' | 'indigo' | 'emerald' | 'rose'
  headers:     Record<string, string>
  payload?:    Record<string, unknown>
  response?:   Record<string, unknown>
}

export interface SettlementLine {
  label:       string
  description: string
  value:       number
  highlight?:  'rose' | 'emerald' | 'neutral'
}

export interface SettlementBreakdownRaw {
  base_value:                    number
  schema_validation_adjustment:  number
  entropy_adjustment:            number
  latency_adjustment:            number
}

export interface HttpTraceStep {
  step:        string
  duration_ms: number
  status:      'success' | 'failed' | 'warning'
  headers?:    Record<string, string>
}

export interface Agent {
  id:                 string
  name:               string
  company:            string
  role:               'buyer' | 'seller' | 'validator' | 'scraper'
  balance:            number
  total_transactions: number
  total_rejected:     number
  verified_by_court?: boolean
}

export interface PragmaticTx {
  // Identity
  id:               string
  created_at:       string
  buyer_id:         string
  seller_id:        string
  task:             string
  task_type:        string
  schema_name:      string
  status:           TxStatus
  rejection_reason?: string
  stage?:           number // Verdict Engine Stage (1, 2, 3)

  // Financials — all pre-computed
  base_value:          number
  amount:              number
  final_payout_usdc:   number
  entropy_score:       number   // 0.0–1.0
  semantic_score:      number   // 0–100 (entropy_score * 100)
  latency_ms:          number

  // Diff Inspector
  expected_schema:      Record<string, unknown>
  actual_output:        Record<string, unknown>
  expected_schema_json: string
  actual_output_json:   string

  // Execution Trace
  trace:      TraceStep[]
  http_trace: HttpTraceStep[]

  // Settlement
  settlement:           SettlementLine[]
  settlement_breakdown: SettlementBreakdownRaw
}

/* ─── Agents ───────────────────────────────────────────────────────────────── */

export const MOCK_AGENTS: Agent[] = [
  { id: 'agent_nexus',   name: 'Nexus Orchestrator', company: 'Axiom Labs',      role: 'buyer',     balance: 4821.2500, total_transactions: 140, total_rejected: 12, verified_by_court: true },
  { id: 'agent_helix',   name: 'Helix Executor',     company: 'DataForge Inc',   role: 'seller',    balance: 3204.7500, total_transactions: 98,  total_rejected: 9, verified_by_court: true  },
  { id: 'agent_atlas',   name: 'Atlas Validator',    company: 'TrustNet Corp',   role: 'validator', balance: 1100.0000, total_transactions: 210, total_rejected: 0, verified_by_court: true  },
  { id: 'agent_orion',   name: 'Orion Scraper',      company: 'Orbital Systems', role: 'scraper',   balance: 892.5000,  total_transactions: 65,  total_rejected: 18, verified_by_court: false },
]

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function iso(msAgo: number): string {
  return new Date(Date.now() - msAgo).toISOString()
}

function buildSettlementLines(b: SettlementBreakdownRaw): SettlementLine[] {
  return [
    { label: 'Base Task Value',                description: 'Agreed contract price',            value: b.base_value,                    highlight: 'neutral' },
    { label: 'Schema Validation',              description: 'Field presence & type check',       value: b.schema_validation_adjustment,  highlight: b.schema_validation_adjustment < 0 ? 'rose' : 'neutral' },
    { label: 'Semantic Accuracy (ΔS_entropy)', description: 'Entropy deviation penalty',         value: b.entropy_adjustment,            highlight: b.entropy_adjustment < 0 ? 'rose' : 'neutral' },
    { label: 'Latency Penalty (T_latency)',    description: 'Response time over SLA threshold',  value: b.latency_adjustment,            highlight: b.latency_adjustment < 0 ? 'rose' : 'neutral' },
    { label: 'Final Settlement',               description: 'Released to seller on-chain',
      value: b.base_value + b.schema_validation_adjustment + b.entropy_adjustment + b.latency_adjustment,
      highlight: 'emerald' },
  ]
}

function buildTrace(status: TxStatus, latencyMs: number): TraceStep[] {
  const steps: TraceStep[] = [
    {
      id: 'req', label: 'GET /api/task', method: 'GET', path: '/api/task',
      statusCode: 402, durationMs: Math.round(latencyMs * 0.1), color: 'gray',
      headers: { 'Host': 'api.parallax.internal', 'X-Agent-ID': 'agent_nexus', 'Accept': 'application/json' },
      response: { code: 402, message: 'Payment required before task execution' },
    },
    {
      id: 'intercept', label: 'HTTP 402 Intercept', method: 'POST', path: '/api/parallax/intercept',
      statusCode: 200, durationMs: Math.round(latencyMs * 0.08), color: 'amber',
      headers: { 'X-Parallax-Version': '1.0.0', 'X-402-Required': 'true', 'X-Escrow-Amount': '1.0000 USDC' },
      payload: { escrow_amount: '1.0000', token: 'USDC', chain: 'BASE' },
    },
    {
      id: 'sign', label: 'X-402-Payment Signed', method: 'POST', path: '/api/parallax/sign',
      statusCode: 200, durationMs: Math.round(latencyMs * 0.4), color: 'indigo',
      headers: { 'X-402-Payment': 'sig_7f3a9c1b4d2e', 'X-Payment-Network': 'BASE', 'Authorization': 'Bearer $PARALLAX_TOKEN' },
      payload: { payment_sig: 'sig_7f3a9c1b4d2e', chain: 'base', token: 'USDC' },
    },
  ]

  if (status === 'CLEARED' || status === 'PARTIAL_PAYOUT') {
    steps.push({
      id: 'release', label: status === 'CLEARED' ? '200 OK — Escrow Released' : '206 Partial — Prorated Payout',
      method: 'GET', path: '/api/task/result',
      statusCode: status === 'CLEARED' ? 200 : 206,
      durationMs: Math.round(latencyMs * 0.42), color: 'emerald',
      headers: { 'X-Escrow-Released': 'true', 'X-Parallax-Score': '0.91', 'Content-Type': 'application/json' },
      response: { status: 'released', settled_at: new Date().toISOString() },
    })
  } else if (status === 'REJECTED_DRIFT') {
    steps.push({
      id: 'reject', label: 'Validation Failed — Schema Drift', method: 'POST', path: '/api/parallax/reject',
      statusCode: 422, durationMs: Math.round(latencyMs * 0.42), color: 'rose',
      headers: { 'X-Parallax-Rejection': 'SCHEMA_DRIFT', 'X-Escrow-Status': 'HELD' },
      response: { error: 'SCHEMA_DRIFT', held_amount: '1.0000', buyer_refund_pending: true },
    })
  } else {
    steps.push({
      id: 'pending', label: 'Awaiting Semantic Verification', durationMs: 0, color: 'gray',
      headers: { 'X-Escrow-Status': 'LOCKED' },
    })
  }

  return steps
}

function buildHttpTrace(trace: TraceStep[]): HttpTraceStep[] {
  return trace.map(t => ({
    step:        t.label,
    duration_ms: t.durationMs,
    status:      t.color === 'rose' ? 'failed' : t.color === 'amber' ? 'warning' : 'success',
    headers:     t.headers,
  }))
}

function tx(
  id: string,
  msAgo: number,
  buyerId: string,
  sellerId: string,
  task: string,
  taskType: string,
  status: TxStatus,
  base: number,
  entropy: number,
  latencyMs: number,
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
  rejectionReason?: string,
): PragmaticTx {
  const latPenalty  = latencyMs > 2000 ? -parseFloat((base * Math.min((latencyMs - 2000) / 20000, 0.12)).toFixed(4)) : 0
  const entPenalty  = entropy < 1.0    ? -parseFloat((base * (1 - entropy) * 0.4).toFixed(4)) : 0
  const schAdj      = status === 'REJECTED_DRIFT' ? -0.05 : 0
  const finalPayout = status === 'CLEARED'        ? parseFloat((base + schAdj + entPenalty + latPenalty).toFixed(4))
                    : status === 'PARTIAL_PAYOUT'  ? parseFloat((base * entropy).toFixed(4))
                    : base
  const breakdown: SettlementBreakdownRaw = {
    base_value: base, schema_validation_adjustment: schAdj,
    entropy_adjustment: entPenalty, latency_adjustment: latPenalty,
  }
  const trace = buildTrace(status, latencyMs)
  
  let stage = 2
  if (rejectionReason && rejectionReason.includes('schema_version expected')) {
    stage = 1 // Schema Drift
  } else if (entropy < 0.60) {
    stage = 2 // Fast Reject
  } else if (entropy >= 0.92 && status === 'CLEARED') {
    stage = 2 // Fast Pass
  } else {
    stage = 3 // LLM Judge Escalation
  }

  return {
    id, created_at: iso(msAgo),
    buyer_id: buyerId, seller_id: sellerId,
    task, task_type: taskType, schema_name: taskType, status,
    rejection_reason: rejectionReason,
    stage,
    base_value: base, amount: finalPayout, final_payout_usdc: finalPayout,
    entropy_score: entropy, semantic_score: Math.round(entropy * 100),
    latency_ms: latencyMs,
    expected_schema: expected, actual_output: actual,
    expected_schema_json: JSON.stringify(expected, null, 2),
    actual_output_json:   JSON.stringify(actual,   null, 2),
    trace, http_trace: buildHttpTrace(trace),
    settlement: buildSettlementLines(breakdown),
    settlement_breakdown: breakdown,
  }
}

/* ─── Scenario 1 — Cross-Database Schema Migration ────────────────────────── */

const schemaMigrationExpected = {
  collection: 'orders',
  schema_version: '2.1',
  document_model: {
    order_id:   { type: 'ObjectId', auto: true },
    customer:   { type: 'embedded', ref: 'customers', required: true },
    line_items: { type: 'array', items: { product_id: 'ObjectId', qty: 'int32', price_usd: 'decimal128' } },
    total_usd:  { type: 'decimal128' },
    status:     { type: 'string', enum: ['pending', 'shipped', 'delivered', 'cancelled'] },
    created_at: { type: 'Date' },
    indexes: [{ fields: ['customer.email'], unique: true }, { fields: ['created_at'], type: 'TTL', expireAfterSeconds: 31536000 }],
  },
}

const schemaMigrationActual = {
  collection: 'orders',
  schema_version: 2.1,
  document_model: {
    order_id:   { type: 'ObjectID', auto: 'yes' },
    customer:   'string',
    line_items: { type: 'array' },
    total_usd:  { type: 'float' },
    status:     { type: 'string' },
    created_at: { type: 'datetime' },
    indexes:    { customer_email: { unique: true } },
  },
}

/* ─── Scenario 2 — Multi-Source Financial Reconciliation ──────────────────── */

const finReconciliationExpected = {
  reconciliation_id: 'string (uuid)',
  source_a: 'CSV ledger',
  source_b: 'PDF invoice',
  total_records_checked: 500,
  discrepancies: [{ row: 'int', source_a_amount: 'number', source_b_amount: 'number', delta: 'number', severity: 'low|medium|high' }],
  discrepancy_count: 'int',
  total_delta_usd: 'number',
  reconciled: 'boolean',
  run_at: 'ISO 8601',
}

const finReconciliationActual = {
  reconciliation_id: 'rec_9d3f2a',
  source_a: 'CSV ledger',
  source_b: 'PDF invoice',
  total_records_checked: 500,
  discrepancies: [
    { row: 14,  source_a_amount: 1042.50, source_b_amount: 1042.55, delta: 0.05, severity: 'low'    },
    { row: 87,  source_a_amount: 8800.00, source_b_amount: 8900.00, delta: 100,  severity: 'high'   },
    { row: 203, source_a_amount: 220.10,  source_b_amount: 220.00,  delta: 0.10, severity: 'medium' },
  ],
  discrepancy_count: 3,
  total_delta_usd: 100.15,
  reconciled: false,
  run_at: new Date().toISOString(),
}

/* ─── Scenario 3 — Zero-Day Vulnerability Patch ───────────────────────────── */

const vulnPatchExpected = {
  vulnerability_id: 'string',
  cve_reference:    'string (optional)',
  severity:         'critical | high | medium | low',
  affected_function: 'string',
  patched_code:     'string (Python)',
  unit_tests:       [{ name: 'string', input: 'any', expected_output: 'any', test_type: 'unit|integration' }],
  test_count:       'int (minimum 3)',
  patch_explanation:'string',
}

const vulnPatchActual = {
  vulnerability_id: 'vuln_sql_001',
  cve_reference:    'CVE-2024-XXXX',
  severity:         'critical',
  affected_function: 'get_user_by_id',
  patched_code: `def get_user_by_id(user_id: int) -> dict:
    query = "SELECT * FROM users WHERE id = %s"
    cursor.execute(query, (user_id,))
    return cursor.fetchone()`,
  unit_tests: [
    { name: 'test_valid_user',   input: 1,          expected_output: { id: 1, name: 'Alice' }, test_type: 'unit' },
    { name: 'test_sql_inject',   input: "1; DROP TABLE users--", expected_output: null, test_type: 'unit' },
  ],
  test_count: 2,
  patch_explanation: 'Replaced f-string interpolation with parameterised query to prevent SQL injection.',
}

/* ─── Scenario 4 — Legal Clause Extraction ────────────────────────────────── */

const legalExtractionExpected = {
  document_type:      'MA_contract',
  clause_type:        'force_majeure',
  clauses: [{
    clause_id:        'string',
    section_ref:      'string (e.g. §12.4)',
    raw_text:         'string',
    governing_law:    'string',
    notice_period_days: 'int',
    covered_events:   ['string'],
    carve_outs:       ['string'],
  }],
  clause_count:       'int',
  extraction_confidence: 'number (0.0–1.0)',
  extracted_at:       'ISO 8601',
}

const legalExtractionActual = {
  document_type: 'MA_contract',
  clause_type:   'force_majeure',
  clauses: [
    {
      clause_id:            'fm_001',
      section_ref:          '§14.2',
      raw_text:             'Neither party shall be liable for delay or failure to perform resulting from causes beyond the reasonable control of such party...',
      governing_law:        'Delaware, USA',
      notice_period_days:   'five business days',
      covered_events:       ['natural disaster', 'pandemic', 'government action', 'cyberattack'],
      carve_outs:           ['payment obligations', 'confidentiality'],
    },
  ],
  clause_count:           1,
  extraction_confidence:  0.84,
  extracted_at:           new Date().toISOString(),
}

/* ─── Generic Schemas for remaining 21 transactions ───────────────────────── */

const GENERIC_SCHEMAS: Array<{
  type: string
  expected: Record<string, unknown>
  goodOutput: Record<string, unknown>
  badOutput:  Record<string, unknown>
}> = [
  {
    type: 'APIContractValidation',
    expected:   { endpoint: 'string', method: 'GET|POST|PUT|DELETE', request_schema: {}, response_schema: {}, breaking_changes: ['string'], validated: true },
    goodOutput: { endpoint: '/api/v2/users', method: 'GET', request_schema: { id: 'uuid' }, response_schema: { users: 'array' }, breaking_changes: [], validated: true },
    badOutput:  { endpoint: '/api/v2/users', method: 'get', request_schema: 'N/A', response_schema: {}, breaking_changes: 'none', validated: 'yes' },
  },
  {
    type: 'MLBiasDetection',
    expected:   { model_id: 'string', protected_attributes: ['string'], bias_score: 'number (0–1)', disparate_impact_ratio: 'number', recommendations: ['string'], compliant: true },
    goodOutput: { model_id: 'clf_v4', protected_attributes: ['gender', 'race'], bias_score: 0.12, disparate_impact_ratio: 0.82, recommendations: ['Resample training data'], compliant: true },
    badOutput:  { model_id: 'clf_v4', protected_attributes: 'gender,race', bias_score: '12%', disparate_impact_ratio: '0.82', recommendations: 'Resample training data', compliant: 1 },
  },
  {
    type: 'NL2SQLTranslation',
    expected:   { natural_language: 'string', sql_query: 'string', dialect: 'PostgreSQL|MySQL|BigQuery', tables_referenced: ['string'], estimated_rows: 'int', safe: true },
    goodOutput: { natural_language: 'Show me top 10 customers by revenue this year', sql_query: 'SELECT customer_id, SUM(revenue) as total FROM orders WHERE YEAR(created_at)=2026 GROUP BY customer_id ORDER BY total DESC LIMIT 10', dialect: 'PostgreSQL', tables_referenced: ['orders'], estimated_rows: 10, safe: true },
    badOutput:  { natural_language: 'Show me top 10 customers by revenue this year', sql_query: 'SELECT * FROM orders', dialect: 'SQL', tables_referenced: 'orders', estimated_rows: 'many', safe: 'true' },
  },
  {
    type: 'SupplyChainAnomaly',
    expected:   { scan_id: 'string', anomalies: [{ sku: 'string', site: 'string', z_score: 'number', severity: 'high|medium|low' }], anomaly_count: 'int', scan_window_days: 'int', model_version: 'string' },
    goodOutput: { scan_id: 'sc_2208', anomalies: [{ sku: 'SKU-4421', site: 'EMEA-WH3', z_score: 3.8, severity: 'high' }], anomaly_count: 1, scan_window_days: 30, model_version: '2.4.1' },
    badOutput:  { scan_id: 'sc_2208', anomalies: 'SKU-4421 at EMEA-WH3 is anomalous', anomaly_count: '1', scan_window_days: '30 days', model_version: 2.4 },
  },
  {
    type: 'GDPRDataAudit',
    expected:   { audit_id: 'string', pii_fields_found: ['string'], high_risk_count: 'int', recommendations: ['string'], retention_violations: ['string'], compliant: 'boolean' },
    goodOutput: { audit_id: 'gdpr_0042', pii_fields_found: ['email', 'ip_address', 'device_id'], high_risk_count: 2, recommendations: ['Anonymise ip_address after 90 days'], retention_violations: [], compliant: false },
    badOutput:  { audit_id: 'gdpr_0042', pii_fields_found: 'email, ip, device_id', high_risk_count: '2', recommendations: 'Anonymise data', retention_violations: null, compliant: 'no' },
  },
]

/* ─── MOCK_TRANSACTIONS ────────────────────────────────────────────────────── */

export const MOCK_TRANSACTIONS: PragmaticTx[] = [
  // ── 4 specific complex scenarios ──────────────────────────────────────────
  tx('tx_8f2a9c1b4d', 1000 * 60 * 2,  'agent_nexus', 'agent_helix',
    'Translate PostgreSQL orders schema to MongoDB document model, preserve all indexes and references',
    'SchemaMigration', 'REJECTED_DRIFT', 2.5000, 0.42, 1840,
    schemaMigrationExpected, schemaMigrationActual,
    'ValidationError: schema_version expected string got number; customer expected embedded object got string; 5 additional field type mismatches'),

  tx('tx_3c7e2f9a1b', 1000 * 60 * 18, 'agent_nexus', 'agent_orion',
    'Cross-reference 500-transaction CSV ledger against PDF invoice, flag discrepancies > $0.05',
    'FinancialReconciliation', 'CLEARED', 4.0000, 0.96, 3210,
    finReconciliationExpected, finReconciliationActual, undefined),

  tx('tx_d4b8e3c2a7', 1000 * 60 * 45, 'agent_nexus', 'agent_helix',
    'Analyse Python codebase for SQL injection vulnerability, return patched function with minimum 3 unit tests',
    'VulnPatchGeneration', 'PARTIAL_PAYOUT', 6.0000, 0.71, 2980,
    vulnPatchExpected, vulnPatchActual,
    'PartialCredit: test_count=2, minimum requirement=3. Entropy penalty applied.'),

  tx('tx_f1c6a4d9e2', 1000 * 60 * 70, 'agent_atlas', 'agent_helix',
    'Parse 10-page M&A contract, extract all Force Majeure clauses into strict JSON array with governing law and notice periods',
    'LegalClauseExtraction', 'PARTIAL_PAYOUT', 8.0000, 0.84, 5400,
    legalExtractionExpected, legalExtractionActual,
    'PartialCredit: notice_period_days returned as string instead of int'),

  // ── 21 generated transactions ──────────────────────────────────────────────
  ...(() => {
    const buyers  = ['agent_nexus', 'agent_atlas']
    const sellers = ['agent_helix', 'agent_orion']
    const statuses: TxStatus[] = ['CLEARED', 'CLEARED', 'CLEARED', 'REJECTED_DRIFT', 'LOCKED', 'CLEARED', 'CLEARED']
    const results: PragmaticTx[] = []

    for (let i = 0; i < 21; i++) {
      const schema  = GENERIC_SCHEMAS[i % GENERIC_SCHEMAS.length]
      const status  = statuses[i % statuses.length]
      const entropy = status === 'CLEARED' ? 0.88 + (i % 5) * 0.02
                    : status === 'REJECTED_DRIFT' ? 0.38 + (i % 3) * 0.08
                    : 0.72
      const base    = parseFloat((1.0 + (i % 10) * 0.8).toFixed(4))
      const lat     = 600 + (i * 137 + 300) % 3400
      const actual  = status === 'REJECTED_DRIFT' ? schema.badOutput : schema.goodOutput
      const ids     = [
        'tx_a1b2c3d4e5','tx_b2c3d4e5f6','tx_c3d4e5f6a7','tx_d4e5f6a7b8',
        'tx_e5f6a7b8c9','tx_f6a7b8c9d0','tx_a7b8c9d0e1','tx_b8c9d0e1f2',
        'tx_c9d0e1f2a3','tx_d0e1f2a3b4','tx_e1f2a3b4c5','tx_f2a3b4c5d6',
        'tx_a3b4c5d6e7','tx_b4c5d6e7f8','tx_c5d6e7f8a9','tx_d6e7f8a9b0',
        'tx_e7f8a9b0c1','tx_f8a9b0c1d2','tx_a9b0c1d2e3','tx_b0c1d2e3f4',
        'tx_c1d2e3f4a5',
      ]

      results.push(tx(
        ids[i],
        1000 * 60 * (90 + i * 25),
        buyers[i % buyers.length],
        sellers[i % sellers.length],
        `Execute ${schema.type.replace(/([A-Z])/g, ' $1').trim()} workflow (batch ${i + 1})`,
        schema.type,
        status,
        base, entropy, lat,
        schema.expected, actual,
        status === 'REJECTED_DRIFT'
          ? `ValidationError: field type mismatch in ${schema.type} schema. ${Math.floor(Math.random() * 4) + 1} fields diverged.`
          : undefined,
      ))
    }
    return results
  })(),
]

/* ─── Telemetry Series (100 points for AgentTelemetry chart) ──────────────── */

export const TELEMETRY_SERIES = Array.from({ length: 100 }, (_, i) => ({
  index:      i,
  confidence: Math.max(40, Math.min(100, 75 + Math.sin(i * 0.31) * 18 + Math.cos(i * 0.07) * 6)),
  latency_ms: Math.max(100, 900 + Math.sin(i * 0.19) * 500 + Math.cos(i * 0.13) * 200),
  timestamp:  iso((100 - i) * 1000 * 60 * 4),
}))
