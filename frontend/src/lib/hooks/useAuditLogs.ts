import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { AuditLog } from "../api/types";

export const AUDIT_LOGS_QUERY_KEY = (page: number, limit: number) => ["audit", "logs", { page, limit }];

export function useAuditLogs(page = 1, limit = 50) {
  return useQuery<AuditLog[], Error>({
    queryKey: AUDIT_LOGS_QUERY_KEY(page, limit),
    queryFn: () => apiClient.getAuditLogs(page, limit),
  });
}
