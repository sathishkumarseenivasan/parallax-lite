import type { Transaction } from './types'

export const MOCK_TRANSACTIONS: Record<string, unknown>[] = [
  {
    id: 'tx_b8d3f1a92e4c',
    buyer_id: 'agent_alpha',
    seller_id: 'agent_beta',
    task_description: 'Extract product pricing from competitive analysis PDF',
    expected_schema: 'PricingData',
    payment_amount: 1.50,
    simulated_output: '{\n  "product": "CyberGoggles",\n  "price": 299.99,\n  "currency": "USD"\n}',
    status: 'CLEARED',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    amount: 1.50
  },
  {
    id: 'tx_c7e4g2b03f5d',
    buyer_id: 'agent_gamma',
    seller_id: 'agent_delta',
    task_description: 'Summarize real-time stock market sentiment',
    expected_schema: 'SentimentAnalysis',
    payment_amount: 0.75,
    simulated_output: '{\n  "sentiment": "bullish",\n  "confidence": 0.89,\n  "sources": ["twitter", "bloomberg"]\n}',
    status: 'LOCKED',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    amount: 0.75
  },
  {
    id: 'tx_d6f5h3c14g6e',
    buyer_id: 'agent_epsilon',
    seller_id: 'agent_zeta',
    task_description: 'Translate user manual from EN to ES',
    expected_schema: 'TranslationOutput',
    payment_amount: 2.20,
    simulated_output: '{\n  "text": "El manual del usuario...",\n  "missing_field": true\n}',
    status: 'REJECTED_DRIFT',
    rejection_reason: "ValidationError: 1 validation error for TranslationOutput\ntarget_language\n  Field required [type=missing, input_value={'text': 'El manual del usuario...', 'missing_field': True}, input_type=dict]",
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    amount: 2.20
  },
  {
    id: 'tx_e5g6i4d25h7f',
    buyer_id: 'agent_eta',
    seller_id: 'agent_theta',
    task_description: 'Generate unit tests for auth middleware',
    expected_schema: 'CodeGeneration',
    payment_amount: 5.00,
    simulated_output: '{\n  "language": "typescript",\n  "code": "describe(\'Auth\', () => {});",\n  "tests_count": 5\n}',
    status: 'CLEARED',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    amount: 5.00
  },
  {
    id: 'tx_f4h7j5e36i8g',
    buyer_id: 'agent_iota',
    seller_id: 'agent_kappa',
    task_description: 'Analyze network logs for anomalies',
    expected_schema: 'SecurityAudit',
    payment_amount: 8.50,
    simulated_output: '{\n  "anomalies_detected": true,\n  "severity": "CRITICAL",\n  "details": "Unusual outbound traffic on port 4444"\n}',
    status: 'CLEARED',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    amount: 8.50
  },
  {
    id: 'tx_g3i8k6f47j9h',
    buyer_id: 'agent_lambda',
    seller_id: 'agent_mu',
    task_description: 'Scrape top 10 HN posts',
    expected_schema: 'WebScraping',
    payment_amount: 0.50,
    simulated_output: '{\n  "posts": [{"title": "Show HN: Something cool", "points": 120}]\n}',
    status: 'LOCKED',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    amount: 0.50
  },
  {
    id: 'tx_h2j9l7g58k0i',
    buyer_id: 'agent_nu',
    seller_id: 'agent_xi',
    task_description: 'Parse resume into structured JSON',
    expected_schema: 'ResumeData',
    payment_amount: 1.10,
    simulated_output: '{\n  "name": "John Doe",\n  "skills": ["Python", "React"]\n}',
    status: 'REJECTED_DRIFT',
    rejection_reason: "ValidationError: 2 validation errors for ResumeData\nemail\n  Field required [type=missing]\nexperience_years\n  Field required [type=missing]",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    amount: 1.10
  }
]
