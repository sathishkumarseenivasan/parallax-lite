'use client'

/**
 * SubmitTaskPanel — inline form for submitting agent-to-agent tasks.
 * Calls POST /api/transactions/submit and triggers data refresh.
 */
import { useState } from 'react'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { transactionsApi } from '@/lib/api'
import type { TaskSubmission, Transaction } from '@/lib/types'
import { MagneticButton } from '@/components/ui/MagneticButton'

const SCHEMA_OPTIONS = ['PriceCheck', 'DataExtraction', 'CodeGeneration'] as const
type SchemaName = typeof SCHEMA_OPTIONS[number]

const EXAMPLE_OUTPUTS: Record<SchemaName, string> = {
  PriceCheck: JSON.stringify({
    item_name: 'MacBook Pro 16-inch',
    price: 2499.99,
    currency: 'USD',
    in_stock: true,
    source_url: 'https://apple.com/shop',
  }, null, 2),
  DataExtraction: JSON.stringify({
    records: [{ id: 1, name: 'Alice' }],
    record_count: 1,
    extraction_confidence: 0.95,
    source: 'https://api.example.com',
  }, null, 2),
  CodeGeneration: JSON.stringify({
    language: 'Python',
    code: "def hello(): return 'world'",
    passes_tests: true,
    line_count: 1,
  }, null, 2),
}

interface SubmitTaskPanelProps {
  onSuccess?: (tx: Transaction) => void
}

export function SubmitTaskPanel({ onSuccess }: SubmitTaskPanelProps) {
  const [schema, setSchema] = useState<SchemaName>('PriceCheck')
  const [amount, setAmount] = useState('2.00')
  const [output, setOutput] = useState(EXAMPLE_OUTPUTS.PriceCheck)
  const [description, setDescription] = useState('Check the price of a product')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSchemaChange = (s: SchemaName) => {
    setSchema(s)
    setOutput(EXAMPLE_OUTPUTS[s])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const payload: TaskSubmission = {
      buyer_id: 'agent_alpha',
      seller_id: 'agent_beta',
      task_description: description,
      expected_schema_name: schema,
      payment_amount: parseFloat(amount),
      simulated_output: output,
    }

    try {
      const tx = await transactionsApi.submit(payload)
      setStatus('success')
      setMessage(
        tx.status === 'CLEARED'
          ? `Cleared — ${amount} credits released to seller.`
          : `Rejected — ${tx.rejection_reason ?? 'Validation failed.'}`
      )
      onSuccess?.(tx)
    } catch (err: unknown) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Submission failed.')
    }
  }

  return (
    <div className="card-premium h-full flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Submit Agent Task</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Test the validation pipeline with a custom output
          </p>
        </div>
      </div>

      <form id="form-submit-task" onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Description */}
        <div>
          <label htmlFor="task-description" className="block text-xs font-semibold text-gray-700 mb-1.5">
            Task Description
          </label>
          <input
            id="task-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all shadow-sm"
            placeholder="Describe the task…"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Schema */}
          <div>
            <label htmlFor="schema-select" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Expected Schema
            </label>
            <select
              id="schema-select"
              value={schema}
              onChange={(e) => handleSchemaChange(e.target.value as SchemaName)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all shadow-sm"
            >
              {SCHEMA_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="payment-amount" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Payment (credits)
            </label>
            <input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0.01"
              max="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all shadow-sm"
              required
            />
          </div>
        </div>

        {/* Simulated Output */}
        <div>
          <label htmlFor="simulated-output" className="block text-xs font-semibold text-gray-700 mb-1.5">
            Seller Output (JSON)
          </label>
          <textarea
            id="simulated-output"
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none transition-all shadow-sm bg-gray-50"
            placeholder='{"key": "value"}'
            required
          />
        </div>

        {/* Status message */}
        {status !== 'idle' && (
          <div
            className={cn(
              'flex items-start gap-2 p-3 rounded-md text-xs',
              status === 'loading' && 'bg-gray-50 text-gray-500',
              status === 'success' && 'bg-emerald-50 text-emerald-700',
              status === 'error' && 'bg-rose-50 text-red-700'
            )}
          >
            {status === 'loading' && <Loader2 size={12} className="animate-spin mt-0.5" />}
            {status === 'success' && <CheckCircle size={12} className="mt-0.5 flex-shrink-0" />}
            {status === 'error' && <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />}
            <span>{status === 'loading' ? 'Processing…' : message}</span>
          </div>
        )}

        <MagneticButton
          id="btn-submit-task"
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm',
            status === 'loading'
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-gray-900 hover:bg-gray-800 text-white'
          )}
        >
          {status === 'loading' ? 'Processing…' : 'Submit Task'}
        </MagneticButton>
      </form>
    </div>
  )
}
