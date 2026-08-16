import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { EscrowTransaction } from "../api/types";

export const PENDING_ESCROW_QUERY_KEY = ["escrow", "pending"];

export function usePendingEscrow() {
  return useQuery<EscrowTransaction[], Error>({
    queryKey: PENDING_ESCROW_QUERY_KEY,
    queryFn: () => apiClient.getPendingEscrow(),
    refetchInterval: 10000, // Poll every 10 seconds for real-time inbox updates
  });
}
