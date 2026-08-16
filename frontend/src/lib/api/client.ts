import { EscrowTransaction, AuditLog, ApprovalResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Base fetcher utility that throws errors on non-2xx responses.
 */
async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Provide default headers but allow overrides
  const headers = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.detail || `API Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * API Client tailored to the Parallax Enterprise Backend
 */
export const apiClient = {
  getPendingEscrow: (): Promise<EscrowTransaction[]> => {
    return fetcher<EscrowTransaction[]>("/api/v1/escrow/pending");
  },
  
  approveEscrow: (txId: string): Promise<ApprovalResponse> => {
    return fetcher<ApprovalResponse>(`/api/v1/escrow/${txId}/approve`, {
      method: "POST",
    });
  },

  rejectEscrow: (txId: string): Promise<ApprovalResponse> => {
    return fetcher<ApprovalResponse>(`/api/v1/escrow/${txId}/reject`, {
      method: "POST",
    });
  },

  getAuditLogs: (page = 1, limit = 50): Promise<AuditLog[]> => {
    return fetcher<AuditLog[]>(`/api/v1/audit/logs?page=${page}&limit=${limit}`);
  },
};
