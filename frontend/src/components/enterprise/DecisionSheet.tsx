"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Transaction } from "@/lib/mockData";

interface DecisionSheetProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DecisionSheet({ transaction, isOpen, onOpenChange }: DecisionSheetProps) {
  const [rejectConfirm, setRejectConfirm] = useState(false);

  if (!transaction) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 transition-opacity" />
        <Dialog.Content className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-stone-50 shadow-sheet z-50 flex flex-col focus:outline-none animate-slide-in border-l border-stone-200">
          
          <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-white">
            <div>
              <Dialog.Title className="text-xl font-medium tracking-tight text-stone-900">
                Escrow Hold Decision
              </Dialog.Title>
              <Dialog.Description className="text-sm text-stone-500 mt-1">
                Review the context and drift proof before releasing funds.
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-900 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Top Half: Context */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">Context Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-md border border-stone-200">
                  <span className="block text-xs text-stone-500 mb-1">Triggered Rule</span>
                  <span className="text-sm font-medium text-amber-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" /> > $1,000 Escrow Hold
                  </span>
                </div>
                <div className="bg-white p-4 rounded-md border border-stone-200">
                  <span className="block text-xs text-stone-500 mb-1">Escrow Amount</span>
                  <span className="text-lg font-mono text-stone-900">${transaction.escrowAmount.toFixed(2)}</span>
                </div>
                <div className="bg-white p-4 rounded-md border border-stone-200">
                  <span className="block text-xs text-stone-500 mb-1">Buyer (Agent Swarm)</span>
                  <span className="text-sm font-mono text-stone-700">{transaction.agentSwarmId}</span>
                </div>
                <div className="bg-white p-4 rounded-md border border-stone-200">
                  <span className="block text-xs text-stone-500 mb-1">Seller (Agent)</span>
                  <span className="text-sm font-mono text-stone-700">{transaction.sellerAgentId}</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-md border border-stone-200">
                <span className="block text-xs text-stone-500 mb-1">Task Intent</span>
                <p className="text-sm text-stone-800 leading-relaxed">{transaction.taskIntent}</p>
              </div>
            </section>

            <hr className="border-stone-200" />

            {/* Bottom Half: Drift Inspector */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider flex items-center justify-between">
                Drift Inspector
                {(transaction.driftData.hallucinatedKeys.length > 0 || transaction.driftData.missingKeys.length > 0) ? (
                  <span className="text-rose-600 text-xs flex items-center bg-rose-50 px-2 py-1 rounded-sm border border-rose-100">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Anomalies Detected
                  </span>
                ) : (
                  <span className="text-emerald-600 text-xs flex items-center bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-100">
                    <CheckCircle className="w-3 h-3 mr-1" /> Clean
                  </span>
                )}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-stone-500">Expected JSON Schema</span>
                  <pre className="bg-stone-900 text-stone-300 p-4 rounded-md text-11 font-mono overflow-auto border border-stone-800">
                    {JSON.stringify(transaction.driftData.expectedSchema, null, 2)}
                  </pre>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-stone-500">Actual Output Payload</span>
                  <pre className="bg-stone-900 text-stone-300 p-4 rounded-md text-11 font-mono overflow-auto border border-stone-800 relative">
                    {JSON.stringify(transaction.driftData.actualOutput, null, 2)}
                  </pre>
                </div>
              </div>

              {(transaction.driftData.hallucinatedKeys.length > 0 || transaction.driftData.missingKeys.length > 0) && (
                <div className="bg-rose-50 border border-rose-200 rounded-md p-4 mt-2">
                  <h4 className="text-xs font-semibold text-rose-800 mb-2 uppercase">Drift Flags</h4>
                  <ul className="space-y-1">
                    {transaction.driftData.missingKeys.map((key, i) => (
                      <li key={`missing-${i}`} className="text-sm text-rose-700 font-mono flex items-center">
                        <XCircle className="w-4 h-4 mr-2 text-rose-500" /> Missing: {key}
                      </li>
                    ))}
                    {transaction.driftData.hallucinatedKeys.map((key, i) => (
                      <li key={`hal-${i}`} className="text-sm text-rose-700 font-mono flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-rose-500" /> Hallucinated: {key}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          {/* Sticky Footer */}
          <div className="p-6 border-t border-stone-200 bg-white flex items-center gap-4">
            {!rejectConfirm ? (
              <button 
                onClick={() => setRejectConfirm(true)}
                className="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-3 rounded-md font-medium transition-colors text-sm"
              >
                Reject & Refund
              </button>
            ) : (
              <button 
                onClick={() => {
                  setRejectConfirm(false);
                  onOpenChange(false);
                }}
                className="flex-1 bg-rose-600 text-white hover:bg-rose-700 px-4 py-3 rounded-md font-medium transition-colors text-sm shadow-sm"
              >
                Confirm Rejection
              </button>
            )}
            <button 
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-3 rounded-md font-medium transition-colors text-sm shadow-sm"
            >
              Approve & Release Funds
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
