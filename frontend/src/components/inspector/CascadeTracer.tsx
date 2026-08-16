'use client'

import React, { useEffect, useState } from 'react'
import { Activity, AlertCircle, ArrowRight, CornerDownRight } from 'lucide-react'

interface CascadeTrace {
  id: string;
  status: string;
  buyer_id: string;
  seller_id: string;
  parent_tx_id?: string;
  entropy_score?: number;
  verdict_breakdown?: { stage: number; reasoning?: string };
}

export function CascadeTracer({ txId }: { txId: string }) {
  const [cascade, setCascade] = useState<CascadeTrace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCascade() {
      try {
        setLoading(true)
        const res = await fetch(`http://127.0.0.1:8000/api/ledger/cascade/${txId}`)
        if (!res.ok) throw new Error('Failed to fetch cascade trace')
        const data = await res.json()
        const parsedCascade = (data.cascade || []).map((t: CascadeTrace) => ({
            ...t,
            verdict_breakdown: t.verdict_breakdown ? (typeof t.verdict_breakdown === 'string' ? JSON.parse(t.verdict_breakdown) : t.verdict_breakdown) : null
        }))
        setCascade(parsedCascade)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchCascade()
  }, [txId])

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        <Activity className="animate-spin mx-auto mb-2" size={18} />
        Tracing cascading transactions...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500 font-mono text-sm">
        <AlertCircle className="mx-auto mb-2" size={18} />
        {error}
      </div>
    )
  }

  if (cascade.length <= 1) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        No downstream cascades detected for this transaction.
      </div>
    )
  }

  return (
    <div className="p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Activity size={16} className="text-indigo-600" />
        Drift Cascade Trace (BFS)
      </h3>
      
      <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[15px] before:border-l-2 before:border-gray-200 before:z-0 pl-1">
        {cascade.map((tx, idx) => (
          <div key={tx.id} className="relative z-10 flex gap-3">
            <div className="flex-shrink-0 mt-1 flex items-center justify-center bg-white rounded-full h-7 w-7 border-2 border-indigo-100 shadow-sm text-indigo-500 text-xs font-bold">
              {idx === 0 ? 'root' : idx}
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded-md p-3 shadow-sm hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-gray-500 truncate max-w-[200px]" title={tx.id}>
                  {tx.id}
                </span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  tx.status === 'CLEARED' ? 'bg-emerald-100 text-emerald-700' :
                  tx.status === 'REJECTED_DRIFT' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {tx.status}
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-1 flex items-center gap-2">
                <span className="font-medium text-gray-900">{tx.buyer_id}</span>
                <ArrowRight size={12} className="text-gray-400" />
                <span className="font-medium text-gray-900">{tx.seller_id}</span>
              </div>
              {tx.parent_tx_id && (
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-2 bg-gray-50 p-1.5 rounded border border-gray-100">
                  <CornerDownRight size={12} className="text-gray-400" />
                  Spawned by <span className="font-mono">{tx.parent_tx_id.split('-')[0]}</span>
                </div>
              )}
              
              <div className="mt-2 flex items-center gap-3">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  Entropy: {(tx.entropy_score || 0).toFixed(2)}
                </span>
                
                {tx.verdict_breakdown && (
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                    S{tx.verdict_breakdown.stage || 2} Verdict
                  </span>
                )}
              </div>
              
              {idx === 0 && tx.verdict_breakdown?.reasoning && (
                <div className="mt-2 text-xs text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-100">
                  " {tx.verdict_breakdown.reasoning} "
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
