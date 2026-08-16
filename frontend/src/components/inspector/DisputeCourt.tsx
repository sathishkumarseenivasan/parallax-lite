'use client'

import React, { useState, useEffect } from 'react'
import { Gavel, AlertCircle, Activity, CheckCircle, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/providers/useStore'

interface Dispute {
  id: string;
  transaction_id: string;
  agent_id: string;
  status: string;
  reason: string;
  resolution_notes?: string;
}

export function DisputeCourt({ txId }: { txId: string }) {
  const [loading, setLoading] = useState(false)
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [fetching, setFetching] = useState(true)
  const [reason, setReason] = useState('')

  useEffect(() => {
    async function fetchDisputes() {
      try {
        setFetching(true)
        const res = await fetch(`http://127.0.0.1:8000/api/disputes/`)
        if (res.ok) {
          const data = await res.json()
          setDisputes(data.filter((d: Dispute) => d.transaction_id === txId))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setFetching(false)
      }
    }
    fetchDisputes()
  }, [txId])

  const handleDispute = async () => {
    if (!reason) return toast.error('Please provide a reason for the dispute')
    setLoading(true)
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txId, agent_id: 'agent_nexus', reason })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'Dispute failed')
      }
      const data = await res.json()
      setDisputes(prev => [data, ...prev])
      toast.success('Dispute filed and resolved')
      setReason('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Dispute failed')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        <Activity className="animate-spin mx-auto mb-2" size={18} />
        Loading court records...
      </div>
    )
  }

  return (
    <div className="p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Scale size={16} className="text-violet-600" />
        Appellate Court Challenges
      </h3>

      <div className="bg-white border border-gray-200 rounded-md p-4 mb-6 shadow-sm">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">File a Dispute</h4>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="State your reasoning for challenging this verdict..."
          className="w-full text-sm p-3 border border-gray-200 rounded outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 mb-3 resize-none bg-gray-50/50"
          rows={3}
        />
        <div className="flex justify-end">
          <button
            onClick={handleDispute}
            disabled={loading || !reason}
            className="btn btn-primary bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Activity className="animate-spin" size={14} /> : <Gavel size={14} />}
            Submit to Court
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {disputes.length === 0 ? (
          <div className="text-center p-6 border border-dashed border-gray-200 rounded-md text-gray-500 text-sm">
            No disputes filed. Challenges appear here when agents escalate a verdict.
          </div>
        ) : (
          disputes.map(d => (
            <div key={d.id} className="bg-gray-50 border border-gray-200 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-semibold text-gray-600">{d.id}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {d.status}
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-3">
                <span className="font-semibold">{d.agent_id}</span> challenged the verdict.
              </div>
              
              <div className="bg-white p-3 rounded border border-gray-100 mb-3 text-sm italic text-gray-600">
                "{d.reason}"
              </div>

              {d.resolution_notes && (
                <div className="bg-violet-50 p-3 rounded border border-violet-100 text-sm">
                  <div className="font-semibold text-violet-800 mb-1 flex items-center gap-1.5">
                    <CheckCircle size={14} /> Court Ruling
                  </div>
                  <div className="text-violet-700">
                    {d.resolution_notes}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
