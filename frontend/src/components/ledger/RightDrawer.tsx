'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Play, Copy, Download, Code, GripVertical } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { SettlementBreakdown } from '@/components/settlement/SettlementBreakdown'
import { ExecutionTrace } from '@/components/trace/ExecutionTrace'
import { DiffInspector } from '@/components/inspector/DiffInspector'
import { JsonViewer } from '@/components/inspector/JsonViewer'
import { CascadeTracer } from '@/components/inspector/CascadeTracer'
import { DisputeCourt } from '@/components/inspector/DisputeCourt'
import type { PragmaticTx } from '@/lib/mock-pragmatic-data'

export function RightDrawer({ tx, onClose }: { tx: PragmaticTx; onClose: () => void }) {
  const [width, setWidth] = useState(480)
  const isDragging = useRef(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const newWidth = document.body.clientWidth - e.clientX
      setWidth(Math.min(Math.max(newWidth, 320), 1000))
    }
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = 'default'
      }
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const tabs = [
    { value: 'settlement', label: 'Settlement' },
    { value: 'trace',      label: 'Exec Trace' },
    { value: 'diff',       label: 'Diff' },
    { value: 'cascade',    label: 'Cascade Trace' },
    { value: 'dispute',    label: 'Dispute' },
    { value: 'raw',        label: 'Raw JSON' },
  ]

  return (
    <motion.div
      key="drawer"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.9 }}
      className="flex flex-col border-l border-gray-200 bg-white overflow-hidden flex-shrink-0 absolute right-0 top-0 bottom-0 z-[60] shadow-2xl"
      style={{ width }}
    >
      {/* Resizer Handle */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 hover:w-1.5 transition-all z-10 flex items-center justify-center group"
        onMouseDown={(e) => {
          e.preventDefault()
          isDragging.current = true
          document.body.style.cursor = 'col-resize'
        }}
      >
        <div className="opacity-0 group-hover:opacity-100 absolute -left-3 bg-indigo-500 rounded text-white shadow p-0.5 pointer-events-none">
          <GripVertical size={12} />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
        <div>
          <p className="font-mono text-sm font-semibold text-gray-900">{tx.id}</p>
          <p className="text-sm text-gray-500 mt-0.5">{tx.buyer_id} → {tx.seller_id}</p>
        </div>
        <button onClick={onClose} className="btn btn-ghost p-1.5" aria-label="Close">
          <X size={16} />
        </button>
      </div>

      {/* Status strip */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex-wrap">
        <span
          className="badge text-sm"
          style={
            tx.status === 'CLEARED'
              ? { background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }
              : tx.status === 'REJECTED_DRIFT'
                ? { background: '#FEF2F2', color: '#E11D48', borderColor: '#FECACA' }
                : { background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' }
          }
        >
          {tx.status === 'REJECTED_DRIFT' ? 'Rejected' : tx.status === 'CLEARED' ? 'Cleared' : 'Locked'}
        </span>
        <span className="text-gray-300">|</span>
        <span className="font-mono text-sm text-gray-600">{tx.base_value.toFixed(4)} USDC</span>
        <span className="text-gray-300">|</span>
        <span className="font-mono text-sm text-gray-600">{tx.semantic_score}% score</span>
        <span className="text-gray-300">|</span>
        <span className="font-mono text-sm text-gray-600">{tx.latency_ms}ms</span>
      </div>

      {/* Quick Action Bar (Retool Style) */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-200 bg-white flex-shrink-0">
        <button 
          onClick={() => {
            const id = toast.loading(`Replaying ${tx.id}...`)
            setTimeout(() => toast.error('Replay failed: Context deadline exceeded', { id }), 1200)
          }}
          className="btn btn-default text-[11px] font-semibold py-1 px-2.5 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors uppercase tracking-wide"
        >
          <Play size={10} className="mr-1.5 inline-block" /> Replay
        </button>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(`curl -X GET https://api.parallax.protocol/v1/tx/${tx.id}`)
            toast.success('cURL copied to clipboard')
          }}
          className="btn btn-default text-[11px] font-semibold py-1 px-2.5 hover:bg-gray-100 transition-colors uppercase tracking-wide"
        >
          <Copy size={10} className="mr-1.5 inline-block" /> cURL
        </button>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(tx, null, 2))
            toast.success('JSON payload copied to clipboard')
          }}
          className="btn btn-default text-[11px] font-semibold py-1 px-2.5 hover:bg-gray-100 transition-colors uppercase tracking-wide"
        >
          <Download size={10} className="mr-1.5 inline-block" /> Export
        </button>
        <a 
          href={`/receipt/${tx.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-default text-[11px] font-semibold py-1 px-2.5 hover:bg-gray-100 transition-colors uppercase tracking-wide inline-flex items-center"
        >
          Receipt
        </a>
        <div className="flex-1" />
        <button className="text-gray-400 hover:text-gray-700 transition-colors p-1" title="View Source">
          <Code size={14} />
        </button>
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="settlement" className="flex flex-col flex-1 overflow-hidden">
        <Tabs.List className="flex border-b border-gray-200 px-5 flex-shrink-0 bg-gray-50">
          {tabs.map(tab => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="px-4 py-2.5 text-[13px] font-medium text-gray-500 border-b-2 border-transparent outline-none transition-colors
                data-[state=active]:text-indigo-600 data-[state=active]:border-indigo-600 data-[state=active]:bg-white hover:text-gray-700"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 overflow-hidden bg-white relative">
          <Tabs.Content value="settlement" className="h-full overflow-y-auto">
            <SettlementBreakdown tx={tx} />
          </Tabs.Content>
          <Tabs.Content value="trace" className="h-full overflow-y-auto">
            <ExecutionTrace tx={tx} />
          </Tabs.Content>
          <Tabs.Content value="diff" className="h-full overflow-y-auto">
            <DiffInspector tx={tx} />
          </Tabs.Content>
          <Tabs.Content value="cascade" className="h-full overflow-y-auto bg-gray-50/50">
            <CascadeTracer txId={tx.id} />
          </Tabs.Content>
          <Tabs.Content value="dispute" className="h-full overflow-y-auto bg-gray-50/50">
            <DisputeCourt txId={tx.id} />
          </Tabs.Content>
          <Tabs.Content value="raw" className="h-full overflow-y-auto bg-[#0D1117]">
            <JsonViewer data={tx} />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </motion.div>
  )
}
