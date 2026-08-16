"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { EscrowTransaction } from "@/lib/api/types";
import { usePendingEscrow } from "@/lib/hooks/usePendingEscrow";
import { useApproveEscrow, useRejectEscrow } from "@/lib/hooks/useEscrowMutations";
import { DecisionSheet } from "./DecisionSheet";

export function ActionInbox() {
  const [selectedTx, setSelectedTx] = useState<EscrowTransaction | null>(null);
  
  const { data: transactions, isLoading, isError } = usePendingEscrow();
  const approveMutation = useApproveEscrow();
  const rejectMutation = useRejectEscrow();

  const getRiskBadge = (score: string) => {
    switch (score) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 rounded-sm bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wide">Critical</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded-sm bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wide">High</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded-sm bg-stone-200 text-stone-700 border border-stone-300 text-[10px] font-bold uppercase tracking-wide">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wide">Low</span>;
    }
  };

  const isPendingLongerThanAnHour = (timestamp: string) => {
    const diff = new Date().getTime() - new Date(timestamp).getTime();
    return diff > 60 * 60 * 1000;
  };

  const handleQuickApprove = (e: React.MouseEvent, txId: string) => {
    e.stopPropagation();
    approveMutation.mutate(txId);
  };

  const handleQuickReject = (e: React.MouseEvent, txId: string) => {
    e.stopPropagation();
    rejectMutation.mutate(txId);
  };

  return (
    <>
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider w-12 text-center"></th>
                <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Timestamp</th>
                <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Agent Swarm ID</th>
                <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Task Intent</th>
                <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">Escrow Amount</th>
                <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-center">Risk</th>
                <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="w-2 h-2 rounded-full bg-stone-200 mx-auto" /></td>
                    <td className="py-3 px-4"><div className="h-4 bg-stone-200 rounded w-24" /></td>
                    <td className="py-3 px-4"><div className="h-4 bg-stone-200 rounded w-32" /></td>
                    <td className="py-3 px-4"><div className="h-4 bg-stone-200 rounded w-48" /></td>
                    <td className="py-3 px-4"><div className="h-4 bg-stone-200 rounded w-20 ml-auto" /></td>
                    <td className="py-3 px-4"><div className="h-5 bg-stone-200 rounded w-16 mx-auto" /></td>
                    <td className="py-3 px-4"><div className="h-6 bg-stone-200 rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              )}
              
              {!isLoading && isError && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-rose-500">
                    Failed to fetch pending transactions. Check your connection.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && transactions?.map((tx) => (
                <tr 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)}
                  className="group hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 text-center align-middle">
                    {isPendingLongerThanAnHour(tx.pendingSince) && (
                      <div className="w-2 h-2 rounded-full bg-amber-600 animate-pulse-slow mx-auto" title="Pending > 1 hour" />
                    )}
                  </td>
                  
                  <td className="py-3 px-4 text-13 text-stone-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                  </td>
                  
                  <td className="py-3 px-4 text-13 font-mono text-stone-700 whitespace-nowrap">
                    {tx.agentSwarmId}
                  </td>
                  
                  <td className="py-3 px-4 text-13 text-stone-900 max-w-xs truncate" title={tx.taskIntent}>
                    {tx.taskIntent}
                  </td>
                  
                  <td className="py-3 px-4 text-right">
                    <span className="text-13 font-mono font-medium text-stone-900">
                      ${tx.escrowAmount.toFixed(2)}
                    </span>
                  </td>
                  
                  <td className="py-3 px-4 text-center">
                    {getRiskBadge(tx.riskScore)}
                  </td>
                  
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                        title="Quick Approve"
                        disabled={approveMutation.isPending}
                        onClick={(e) => handleQuickApprove(e, tx.id)}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                        title="Quick Reject"
                        disabled={rejectMutation.isPending}
                        onClick={(e) => handleQuickReject(e, tx.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && transactions?.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-stone-500">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    No pending transactions requiring human approval.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DecisionSheet 
        transaction={selectedTx} 
        isOpen={selectedTx !== null} 
        onOpenChange={(open) => !open && setSelectedTx(null)} 
      />
    </>
  );
}
