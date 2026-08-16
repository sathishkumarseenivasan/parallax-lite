'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ShieldCheck, Activity, Printer, Hash, Clock, FileText } from 'lucide-react'

interface Receipt {
  transaction_id: string
  buyer_id: string
  seller_id: string
  chain_record: { hash: string; timestamp: string }
  verdict_breakdown?: { stage: number; entropy_score: number; latency_ms: number; provider: string; reasoning: string }
}

export default function ReceiptPage() {
  const { id } = useParams()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReceipt() {
      try {
        setLoading(true)
        const res = await fetch(`http://127.0.0.1:8000/api/receipts/${id}`)
        if (!res.ok) throw new Error('Receipt not found or could not be generated')
        const data = await res.json()
        setReceipt(data)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchReceipt()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-mono text-sm">
        <Activity className="animate-spin mr-2" size={18} />
        Generating verifiable verdict receipt...
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-rose-500 font-mono text-sm">
        This receipt does not exist. Either the link is wrong, or someone tampered with history. Both are worth checking.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white flex justify-center">
      <div className="bg-white max-w-3xl w-full p-10 border border-gray-200 shadow-xl print:shadow-none print:border-none print:p-4 rounded-xl">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-10 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Parallax Protocol</h1>
              <p className="text-sm font-mono text-gray-500 mt-1 uppercase tracking-widest">Official Verdict Receipt</p>
            </div>
          </div>
          <button 
            onClick={() => window.print()}
            className="btn btn-default border border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-50 print:hidden flex items-center gap-2 text-sm font-medium"
          >
            <Printer size={16} /> Print Receipt
          </button>
        </div>

        {/* Core Metadata */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Transaction Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                <span className="text-sm text-gray-500">ID</span>
                <span className="font-mono text-sm text-gray-900">{receipt.transaction_id}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                <span className="text-sm text-gray-500">Buyer</span>
                <span className="font-mono text-sm text-indigo-600 font-medium">{receipt.buyer_id}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                <span className="text-sm text-gray-500">Seller</span>
                <span className="font-mono text-sm text-emerald-600 font-medium">{receipt.seller_id}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Integrity Chain</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Hash size={12} /> Block Hash
                </div>
                <div className="font-mono text-xs text-gray-900 break-all">{receipt.chain_record.hash}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Clock size={12} /> Timestamp
                </div>
                <div className="font-mono text-xs text-gray-900">{new Date(receipt.chain_record.timestamp).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Verdict Breakdown */}
        {receipt.verdict_breakdown && (
          <div className="mb-10">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText size={14} /> Semantic Verdict Breakdown
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 bg-gray-50 p-3 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-500">Stage</div>
                <div className="text-xs font-medium text-gray-500">Entropy Score</div>
                <div className="text-xs font-medium text-gray-500">Latency</div>
                <div className="text-xs font-medium text-gray-500">Provider</div>
              </div>
              <div className="grid grid-cols-4 p-4 items-center">
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    receipt.verdict_breakdown.stage === 1 ? 'bg-red-100 text-red-700' :
                    receipt.verdict_breakdown.stage === 2 ? 'bg-emerald-100 text-emerald-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    S{receipt.verdict_breakdown.stage || 2}
                  </span>
                </div>
                <div className="font-mono text-sm">{(receipt.verdict_breakdown.entropy_score || 0).toFixed(4)}</div>
                <div className="font-mono text-sm">{receipt.verdict_breakdown.latency_ms || 0} ms</div>
                <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded inline-block w-max">
                  {receipt.verdict_breakdown.provider || 'deterministic'}
                </div>
              </div>
              
              {receipt.verdict_breakdown.reasoning && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Court Reasoning</h4>
                  <p className="text-sm text-gray-700 italic">"{receipt.verdict_breakdown.reasoning}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400 font-mono">
            This receipt is cryptographically verifiable. Do not alter contents.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 opacity-50">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold tracking-widest uppercase">Parallax Court System</span>
          </div>
        </div>

      </div>
    </div>
  )
}
