'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Box, DollarSign, Send, FileJson, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAgents } from '@/hooks/useTransactions'
import { useRouter } from 'next/navigation'

export function TaskComposer() {
  const router = useRouter()
  const { agents } = useAgents()
  
  const [schemas, setSchemas] = useState<{name: string}[]>([])
  const [selectedSchema, setSelectedSchema] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [amount, setAmount] = useState(5.0)
  const [payload, setPayload] = useState('{\n  \n}')
  const [txState, setTxState] = useState<'IDLE' | 'LOCKED' | 'VERDICT' | 'SETTLED'>('IDLE')
  const [lastTx, setLastTx] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    // Fetch schemas
    api.get('/schemas').then((res: unknown) => {
      if (Array.isArray(res)) {
        setSchemas(res as {name: string}[])
        if (res.length > 0 && res[0].name) setSelectedSchema(res[0].name as string)
      }
    }).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!sellerId || !selectedSchema) return toast.error('Select an agent and schema')
    
    setTxState('LOCKED')
    toast.info('Escrow locked')
    
    try {
      setTxState('VERDICT')
      const tx = await api.post('/transactions/submit', {
        buyer_id: 'agent_alpha', // default buyer
        seller_id: sellerId,
        task_description: `No-code task via ${selectedSchema}`,
        expected_schema_name: selectedSchema,
        payment_amount: amount,
        simulated_output: payload
      })
      
      setTxState('SETTLED')
      setLastTx(tx as Record<string, unknown>)
      api.post('/onboarding/event', { event_name: 'task_submitted' }).catch(() => {})
      toast.success('Transaction complete')
    } catch (err: unknown) {
      setTxState('IDLE')
      const detail = err && typeof err === 'object' && 'detail' in err ? String((err as Record<string, unknown>).detail) : 'Unknown error'
      toast.error('Transaction failed: ' + detail)
    }
  }

  const openInspector = () => {
    if (!lastTx) return
    window.dispatchEvent(new CustomEvent('open_tx', { detail: lastTx }))
    router.push('/app')
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <div className="box p-6 bg-white border border-gray-200">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Send size={18} className="text-indigo-600" /> Task Composer
        </h2>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wider">Seller Agent</label>
            <select 
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
              value={sellerId}
              onChange={e => setSellerId(e.target.value)}
            >
              <option value="">Select an agent...</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wider">Expected Schema</label>
            <select 
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
              value={selectedSchema}
              onChange={e => setSelectedSchema(e.target.value)}
            >
              <option value="">Select a schema...</option>
              {schemas.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">Escrow Amount: {amount.toFixed(2)} USDC</label>
          </div>
          <input 
            type="range" min="0.5" max="100" step="0.5" 
            value={amount} onChange={e => setAmount(parseFloat(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wider">
            <FileJson size={14} /> Simulated Output Payload
          </label>
          <textarea
            className="w-full h-40 border border-gray-300 rounded p-3 font-mono text-sm focus:border-indigo-500 outline-none resize-none"
            value={payload}
            onChange={e => setPayload(e.target.value)}
            spellCheck={false}
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={txState !== 'IDLE' && txState !== 'SETTLED'}
          className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {txState === 'IDLE' || txState === 'SETTLED' ? 'Submit to Escrow' : 'Processing...'}
          <ArrowRight size={16} />
        </button>
      </div>

      {txState !== 'IDLE' && (
        <div className="box p-5 bg-white border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Transaction Lifecycle</h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-2 text-indigo-600">
              <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center bg-white z-10"><DollarSign size={14}/></div>
              <span className="text-xs font-semibold">LOCKED</span>
            </div>
            <div className={`flex-1 h-[2px] -mt-6 ${txState === 'VERDICT' || txState === 'SETTLED' ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            
            <div className={`flex flex-col items-center gap-2 ${txState === 'VERDICT' || txState === 'SETTLED' ? 'text-indigo-600' : 'text-gray-300'}`}>
              <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center bg-white z-10"><Box size={14}/></div>
              <span className="text-xs font-semibold">VERDICT</span>
            </div>
            <div className={`flex-1 h-[2px] -mt-6 ${txState === 'SETTLED' ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            
            <div className={`flex flex-col items-center gap-2 ${txState === 'SETTLED' ? 'text-emerald-600' : 'text-gray-300'}`}>
              <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center bg-white z-10"><CheckCircle2 size={14}/></div>
              <span className="text-xs font-semibold">SETTLED</span>
            </div>
          </div>
          
          {txState === 'SETTLED' && lastTx && (
            <div className="mt-6 flex justify-center">
              <button 
                onClick={openInspector}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-indigo-600 text-sm font-semibold rounded transition"
              >
                Inspect Settlement Trace
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
