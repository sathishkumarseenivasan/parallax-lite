import { subHours, subMinutes } from "date-fns";

export interface Transaction {
  id: string;
  timestamp: string;
  agentSwarmId: string;
  sellerAgentId: string;
  taskIntent: string;
  escrowAmount: number;
  riskScore: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  pendingSince: string;
  driftData: {
    expectedSchema: Record<string, any>;
    actualOutput: Record<string, any>;
    missingKeys: string[];
    hallucinatedKeys: string[];
  };
}

export interface AuditLog {
  eventId: string;
  actionType: "ESCROW_LOCKED" | "SCHEMA_FAILED" | "SCHEMA_PASSED" | "ESCROW_RELEASED" | "TRANSACTION_HALTED";
  actor: string;
  timestamp: string;
  sha256Hash: string;
}

const now = new Date();

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_8f92a1b3c4d5",
    timestamp: subMinutes(now, 12).toISOString(),
    agentSwarmId: "swarm_aws_provisioner",
    sellerAgentId: "agent_cloud_exec",
    taskIntent: "Provision 10x p4d.24xlarge AWS instances for ML training run.",
    escrowAmount: 14500.00,
    riskScore: "CRITICAL",
    pendingSince: subMinutes(now, 12).toISOString(),
    driftData: {
      expectedSchema: { instanceType: "p4d.24xlarge", count: 10, region: "us-east-1", maxPriceLimit: 15000 },
      actualOutput: { instanceType: "p4d.24xlarge", count: 10, region: "us-east-1", maxPriceLimit: 14500, autoRenew: true },
      missingKeys: [],
      hallucinatedKeys: ["autoRenew"]
    }
  },
  {
    id: "tx_7e81b2c3d4e5",
    timestamp: subHours(now, 2).toISOString(),
    agentSwarmId: "swarm_data_acquisition",
    sellerAgentId: "agent_web_scraper_pro",
    taskIntent: "Hire scraper to extract pricing data from 5 competitor sites.",
    escrowAmount: 1250.00,
    riskScore: "MEDIUM",
    pendingSince: subHours(now, 2).toISOString(),
    driftData: {
      expectedSchema: { targetSites: ["A", "B", "C", "D", "E"], frequency: "daily", format: "csv" },
      actualOutput: { targetSites: ["A", "B", "C", "D"], frequency: "daily", format: "json" },
      missingKeys: ["targetSites: 'E'"],
      hallucinatedKeys: ["format: 'json' instead of 'csv'"]
    }
  },
  {
    id: "tx_6d70c1b2a3f4",
    timestamp: subMinutes(now, 45).toISOString(),
    agentSwarmId: "swarm_marketing_ops",
    sellerAgentId: "agent_copywriter_v4",
    taskIntent: "Generate and launch LinkedIn ad campaign for Q3.",
    escrowAmount: 3500.00,
    riskScore: "HIGH",
    pendingSince: subMinutes(now, 45).toISOString(),
    driftData: {
      expectedSchema: { platform: "LinkedIn", adCount: 5, budgetLimit: 3500 },
      actualOutput: { platform: "LinkedIn", adCount: 5, budgetLimit: 5000 },
      missingKeys: [],
      hallucinatedKeys: ["budgetLimit exceeded"]
    }
  },
  {
    id: "tx_5c60b1a293e4",
    timestamp: subMinutes(now, 5).toISOString(),
    agentSwarmId: "swarm_legal_review",
    sellerAgentId: "agent_contract_analyzer",
    taskIntent: "Review M&A NDA documents for compliance violations.",
    escrowAmount: 2200.00,
    riskScore: "MEDIUM",
    pendingSince: subMinutes(now, 5).toISOString(),
    driftData: {
      expectedSchema: { docId: "doc_123", checkCompliance: true, highlightViolations: true },
      actualOutput: { docId: "doc_123", checkCompliance: true, highlightViolations: true, externalAPI: "openai_used" },
      missingKeys: [],
      hallucinatedKeys: ["externalAPI"]
    }
  },
  {
    id: "tx_4b50a19283d4",
    timestamp: subHours(now, 1.5).toISOString(),
    agentSwarmId: "swarm_financial_audit",
    sellerAgentId: "agent_tax_calculator",
    taskIntent: "Calculate Q2 corporate tax liabilities.",
    escrowAmount: 5000.00,
    riskScore: "CRITICAL",
    pendingSince: subHours(now, 1.5).toISOString(),
    driftData: {
      expectedSchema: { quarter: "Q2", totalLiability: "number", deductions: "array" },
      actualOutput: { quarter: "Q2", totalLiability: 125000, deductions: ["R&D", "Depreciation"], assumedRisk: "low" },
      missingKeys: [],
      hallucinatedKeys: ["assumedRisk"]
    }
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { eventId: "evt_1a2b3c", actionType: "TRANSACTION_HALTED", actor: "System", timestamp: subMinutes(now, 12).toISOString(), sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
  { eventId: "evt_2b3c4d", actionType: "SCHEMA_FAILED", actor: "agent_cloud_exec", timestamp: subMinutes(now, 13).toISOString(), sha256Hash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92" },
  { eventId: "evt_3c4d5e", actionType: "ESCROW_LOCKED", actor: "swarm_aws_provisioner", timestamp: subMinutes(now, 14).toISOString(), sha256Hash: "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c" },
  { eventId: "evt_4d5e6f", actionType: "ESCROW_RELEASED", actor: "admin_jdoe", timestamp: subMinutes(now, 30).toISOString(), sha256Hash: "7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730" },
  { eventId: "evt_5e6f7g", actionType: "SCHEMA_PASSED", actor: "agent_data_cleaner", timestamp: subMinutes(now, 32).toISOString(), sha256Hash: "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2" },
  { eventId: "evt_6f7g8h", actionType: "TRANSACTION_HALTED", actor: "System", timestamp: subHours(now, 2).toISOString(), sha256Hash: "0a0a9f2a6772942557ab5355d76af442f8f65e01f6610ff61eb0d507c57f2025" },
  { eventId: "evt_7g8h9i", actionType: "SCHEMA_FAILED", actor: "agent_web_scraper_pro", timestamp: subHours(now, 2).toISOString(), sha256Hash: "a2b6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2f2ca1bb" },
  { eventId: "evt_8h9i0j", actionType: "ESCROW_LOCKED", actor: "swarm_data_acquisition", timestamp: subHours(now, 2).toISOString(), sha256Hash: "57ab5355d76af442f8f65e01f6610ff61eb0d507c57f20250a0a9f2a67729425" },
  { eventId: "evt_9i0j1k", actionType: "TRANSACTION_HALTED", actor: "System", timestamp: subMinutes(now, 45).toISOString(), sha256Hash: "c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855e3b0" },
  { eventId: "evt_0j1k2l", actionType: "ESCROW_RELEASED", actor: "admin_smathers", timestamp: subHours(now, 3).toISOString(), sha256Hash: "9a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c928d969eef6ecad3c2" }
];
