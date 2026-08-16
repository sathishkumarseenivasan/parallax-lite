import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "../api/client";
import { EscrowTransaction } from "../api/types";
import { PENDING_ESCROW_QUERY_KEY } from "./usePendingEscrow";

export function useApproveEscrow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (txId: string) => apiClient.approveEscrow(txId),
    
    // Optimistic UI Update
    onMutate: async (txId: string) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: PENDING_ESCROW_QUERY_KEY });

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData<EscrowTransaction[]>(PENDING_ESCROW_QUERY_KEY);

      // Optimistically update the cache: instantly remove the transaction
      if (previousTransactions) {
        queryClient.setQueryData<EscrowTransaction[]>(
          PENDING_ESCROW_QUERY_KEY,
          previousTransactions.filter((tx) => tx.id !== txId)
        );
      }

      // Return context to rollback in case of error
      return { previousTransactions };
    },

    // On Failure: Rollback the cache and show Vivid Rose toast
    onError: (err, txId, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(PENDING_ESCROW_QUERY_KEY, context.previousTransactions);
      }
      toast.error("Network Error: Funds remain locked", {
        description: err.message || "Failed to approve transaction",
        className: "bg-rose-50 text-rose-800 border-rose-200",
      });
    },

    // On Success: Show Emerald Green toast
    onSuccess: (data) => {
      toast.success("Escrow Released Successfully", {
        description: `Transaction ${data.transaction_id} is now cleared.`,
        className: "bg-emerald-50 text-emerald-800 border-emerald-200",
      });
    },

    // Always refetch after error or success to ensure synchronization
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_ESCROW_QUERY_KEY });
    },
  });
}

export function useRejectEscrow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (txId: string) => apiClient.rejectEscrow(txId),
    
    // Optimistic UI Update
    onMutate: async (txId: string) => {
      await queryClient.cancelQueries({ queryKey: PENDING_ESCROW_QUERY_KEY });
      const previousTransactions = queryClient.getQueryData<EscrowTransaction[]>(PENDING_ESCROW_QUERY_KEY);

      if (previousTransactions) {
        queryClient.setQueryData<EscrowTransaction[]>(
          PENDING_ESCROW_QUERY_KEY,
          previousTransactions.filter((tx) => tx.id !== txId)
        );
      }

      return { previousTransactions };
    },

    // On Failure: Rollback
    onError: (err, txId, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(PENDING_ESCROW_QUERY_KEY, context.previousTransactions);
      }
      toast.error("Network Error: Action failed", {
        description: err.message || "Failed to reject transaction",
        className: "bg-rose-50 text-rose-800 border-rose-200",
      });
    },

    // On Success
    onSuccess: (data) => {
      toast.success("Transaction Rejected & Refunded", {
        description: `Funds returned to buyer for ${data.transaction_id}.`,
        className: "bg-amber-50 text-amber-800 border-amber-200",
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_ESCROW_QUERY_KEY });
    },
  });
}
