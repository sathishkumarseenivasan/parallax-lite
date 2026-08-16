'use client'

import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { X, Copy, Check, RotateCw, AlertTriangle, Clock, Code2, Play, Terminal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatRelativeTime, copyToClipboard } from '@/lib/utils'
import type { Transaction } from '@/lib/types'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/dashboard/TransactionTable'

interface TransactionInspectorProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionInspector({ transaction, open, onOpenChange }: TransactionInspectorProps) {
  const [copied, setCopied] = useState(false)
  const [isReplaying, setIsReplaying] = useState(false)

  if (!transaction) return null

  const handleCopyCurl = async () => {
    const curl = `curl -X POST https://api.parallax.lite/v1/transactions/replay \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $AGENT_TOKEN" \\
  -d '{"tx_id": "${transaction.id}"}'`
    
    await copyToClipboard(curl)
    setCopied(true)
    toast.success('Copied cURL to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReplay = () => {
    setIsReplaying(true)
    toast.loading('Replaying transaction...', { id: 'replay' })
    setTimeout(() => {
      setIsReplaying(false)
      toast.error('Replay failed: Same validation error occurred.', { id: 'replay' })
    }, 1500)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: '100%', opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0.5 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
                className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-gray-200/60 outline-none flex flex-col"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Dialog.Title className="text-lg font-mono font-semibold text-gray-900 tracking-tight">
                        TX_{transaction.id.slice(0, 8)}
                      </Dialog.Title>
                      <StatusBadge status={transaction.status} />
                    </div>
                    <Dialog.Description className="text-xs text-gray-500 font-mono">
                      Created {formatRelativeTime(transaction.created_at)}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                    <X size={16} />
                  </Dialog.Close>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <Tabs.Root defaultValue="payload" className="flex flex-col h-full">
                    <Tabs.List className="flex border-b border-gray-100 px-6 shrink-0 bg-gray-50/30">
                      <Tabs.Trigger
                        value="payload"
                        className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 outline-none transition-colors"
                      >
                        Payload
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="trace"
                        className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 data-[state=active]:text-rose-600 data-[state=active]:border-b-2 data-[state=active]:border-rose-600 outline-none transition-colors"
                      >
                        Validation Trace
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="meta"
                        className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-gray-900 outline-none transition-colors"
                      >
                        Metadata
                      </Tabs.Trigger>
                    </Tabs.List>

                    <div className="p-6 flex-1 bg-gray-50/30">
                      <Tabs.Content value="payload" className="h-full outline-none animate-fade-in">
                        <div className="flex items-center gap-2 mb-3">
                          <Code2 size={16} className="text-gray-400" />
                          <h3 className="text-sm font-semibold text-gray-700">Simulated Output JSON</h3>
                        </div>
                        <div className="bg-[#0E1116] rounded-lg p-4 border border-gray-800 shadow-inner overflow-x-auto relative group">
                           <button 
                             onClick={() => copyToClipboard((transaction as any).simulated_output || '')}
                             className="absolute top-2 right-2 p-1.5 bg-gray-800 text-gray-400 rounded hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <Copy size={14} />
                           </button>
                           <pre className="text-xs font-mono text-[#EDEAE3] leading-relaxed">
                             {transaction.actual_output || 'No output recorded.'}
                           </pre>
                        </div>
                      </Tabs.Content>

                      <Tabs.Content value="trace" className="h-full outline-none animate-fade-in">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle size={16} className="text-rose-500" />
                          <h3 className="text-sm font-semibold text-gray-700">Pydantic Error Trace</h3>
                        </div>
                        {transaction.status === 'REJECTED_DRIFT' ? (
                          <div className="bg-[#2A1115] rounded-lg p-4 border border-rose-900/50 shadow-inner overflow-x-auto">
                            <pre className="text-xs font-mono text-rose-300 leading-relaxed">
                              {transaction.rejection_reason}
                            </pre>
                          </div>
                        ) : (
                          <div className="h-32 flex items-center justify-center border border-dashed border-gray-200 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-400 font-medium">No validation errors.</p>
                          </div>
                        )}
                      </Tabs.Content>

                      <Tabs.Content value="meta" className="h-full outline-none animate-fade-in space-y-6">
                         <div>
                           <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Execution Details</h3>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                               <p className="text-xs text-gray-500 mb-1">Time to Validate</p>
                               <p className="text-sm font-mono font-medium text-gray-900 flex items-center gap-1.5"><Clock size={14} className="text-gray-400"/> 42ms</p>
                             </div>
                             <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                               <p className="text-xs text-gray-500 mb-1">Expected Schema</p>
                               <p className="text-sm font-mono font-medium text-gray-900">{transaction.expected_schema}</p>
                             </div>
                           </div>
                         </div>
                         
                         <div>
                           <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Counterparties</h3>
                           <div className="space-y-2">
                             <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                               <span className="text-xs text-gray-500">Buyer</span>
                               <span className="text-xs font-mono text-gray-900 bg-indigo-50 px-2 py-0.5 rounded text-indigo-700">{transaction.buyer_id}</span>
                             </div>
                             <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                               <span className="text-xs text-gray-500">Seller</span>
                               <span className="text-xs font-mono text-gray-900 bg-emerald-50 px-2 py-0.5 rounded text-emerald-700">{transaction.seller_id}</span>
                             </div>
                           </div>
                         </div>
                      </Tabs.Content>
                    </div>
                  </Tabs.Root>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
                  <button
                    onClick={handleCopyCurl}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Terminal size={14} />}
                    Copy as cURL
                  </button>
                  <button
                    onClick={handleReplay}
                    disabled={isReplaying}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isReplaying ? <RotateCw size={14} className="animate-spin" /> : <Play size={14} />}
                    Replay Transaction
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
