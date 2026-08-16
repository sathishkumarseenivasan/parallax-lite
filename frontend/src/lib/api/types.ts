export interface DriftData {
  expectedSchema: Record<string, any>;
  actualOutput: Record<string, any>;
  missingKeys: string[];
  hallucinatedKeys: string[];
}

export interface EscrowTransaction {
  id: string;
  timestamp: string;
  agentSwarmId: string;
  sellerAgentId: string;
  taskIntent: string;
  escrowAmount: number;
  riskScore: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  pendingSince: string;
  driftData: DriftData;
}

export interface AuditLog {
  eventId: string;
  actionType: "ESCROW_LOCKED" | "SCHEMA_FAILED" | "SCHEMA_PASSED" | "ESCROW_RELEASED" | "TRANSACTION_HALTED";
  actor: string;
  timestamp: string;
  sha256Hash: string;
}

export interface ApprovalResponse {
  status: "success" | "error";
  message: string;
  transaction_id: string;
  new_status: string;
}
