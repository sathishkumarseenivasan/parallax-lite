'use client'

/**
 * TransactionTable — the core dashboard component.
 * Enterprise Data Grid with beautiful status badges and loading states.
 */
import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { cn, formatCredits, formatRelativeTime, truncateId, copyToClipboard } from '@/lib/utils'
import type { Transaction } from '@/lib/types'
import { AnimatedBorder } from '@/components/ui/AnimatedBorder'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreHorizontal, FileJson, Copy as CopyIcon, Play } from 'lucide-react'
import { TransactionInspector } from '@/components/inspector/TransactionInspector'

export function StatusBadge({ status }: { status: Transaction['status'] }) {
  const cls =
    status === 'CLEARED'        ? 'badge-cleared'  :
    status === 'REJECTED_DRIFT' ? 'badge-rejected' :
    status === 'LOCKED'         ? 'badge-locked'   : 'badge-pending'
  const label =
    status === 'REJECTED_DRIFT' ? 'Rejected' :
    status === 'LOCKED'         ? 'Locked'   :
    status === 'CLEARED'        ? 'Cleared'  : 'Pending'
  return <span className={`badge ${cls}`}>{label}</span>
}

import Link from 'next/link'

function CopyableId({ id }: { id: string }) {
  return (
    <Link 
      href={`/transactions?id=${id}`}
      className="inline-flex items-center gap-1.5 group hover:text-indigo-600 transition-colors"
      title="Open in Right Drawer"
    >
      <span className="font-mono text-xs font-semibold group-hover:underline">
        {truncateId(id)}
      </span>
      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}

function ExpandedRow({ transaction }: { transaction: Transaction }) {
  return (
    <tr className="bg-gray-50/50 animate-fade-in border-b border-gray-100">
      <td colSpan={8} className="px-6 py-4">
        <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-rose-700 mb-1">
              Semantic Drift Detected
            </p>
            <p className="text-xs text-gray-600 font-mono leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
              {transaction.rejection_reason ?? 'No reason recorded.'}
            </p>
          </div>
        </div>
      </td>
    </tr>
  )
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className={cn('h-4 skeleton-shimmer rounded', j === 0 ? 'w-24' : j === 3 ? 'w-16' : 'w-20')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function EmptyDataState() {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
        <rect x="20" y="20" width="80" height="80" rx="20" fill="#F1F5F9" />
        <path d="M40 60C40 48.9543 48.9543 40 60 40C71.0457 40 80 48.9543 80 60C80 71.0457 71.0457 80 60 80C48.9543 80 40 71.0457 40 60Z" fill="white" />
        <circle cx="60" cy="60" r="12" fill="#E2E8F0" />
        <path d="M60 20V40" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 4" />
        <path d="M60 80V100" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 4" />
        <path d="M20 60H40" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 4" />
        <path d="M80 60H100" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 4" />
      </svg>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Awaiting Agent Swarm Activity...</h3>
      <p className="text-xs text-gray-500 max-w-sm">No drift in the last 24h — your swarm is healthy</p>
    </div>
  )
}

export function TransactionTable({ transactions, isLoading, isError }: { transactions: Transaction[], isLoading: boolean, isError: boolean }) {
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  
  const handleOpenInspector = (tx: Transaction) => {
    setSelectedTx(tx)
    setInspectorOpen(true)
  }

  if (isError) {
    return (
      <div className="card-premium p-8 text-center bg-rose-50/50">
        <p className="text-sm text-rose-600 font-medium">Could not fetch transactions.</p>
        <p className="text-xs text-gray-500 mt-1">Make sure the backend is running.</p>
      </div>
    )
  }

  return (
    <div className="card-premium flex flex-col relative">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
        <div className="flex items-center gap-2">
           <span className="px-2 py-1 rounded bg-gray-100 text-[10px] font-mono text-gray-500">{transactions.length} total</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-white/70 backdrop-blur-md shadow-[0_1px_0_0_rgba(226,232,240,0.6)]">
            <tr>
              {['TX ID', 'Buyer', 'Seller', 'Amount', 'Schema', 'Status', 'Time', ''].map((col, idx) => (
                <th key={idx} className="px-6 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <TableSkeleton />
            ) : transactions.length === 0 ? (
              <tr><td colSpan={8}><EmptyDataState /></td></tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors duration-150 group relative">
                  <td className="px-6 py-4">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CopyableId id={tx.id} />
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{truncateId(tx.buyer_id, 8)}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{truncateId(tx.seller_id, 8)}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-900 tabular-nums font-medium">{formatCredits(tx.amount)}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{tx.expected_schema}</td>
                  <td className="px-6 py-4"><StatusBadge status={tx.status} /></td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono">{formatRelativeTime(tx.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger className="p-1.5 rounded hover:bg-gray-200/50 text-gray-400 hover:text-gray-900 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                        <MoreHorizontal size={16} />
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content align="end" className="z-50 min-w-[180px] bg-white rounded-lg shadow-xl border border-gray-200/60 p-1 animate-fade-in origin-top-right">
                          <DropdownMenu.Item 
                            onClick={() => handleOpenInspector(tx)}
                            className="flex items-center px-2 py-1.5 text-xs text-gray-700 cursor-pointer outline-none hover:bg-gray-50 rounded"
                          >
                            <FileJson size={14} className="mr-2 text-gray-400" />
                            View Inspector
                          </DropdownMenu.Item>
                          <DropdownMenu.Item 
                            onClick={() => copyToClipboard(tx.id)}
                            className="flex items-center px-2 py-1.5 text-xs text-gray-700 cursor-pointer outline-none hover:bg-gray-50 rounded"
                          >
                            <CopyIcon size={14} className="mr-2 text-gray-400" />
                            Copy TX ID
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="h-px bg-gray-100 my-1 mx-2" />
                          <DropdownMenu.Item 
                            className="flex items-center px-2 py-1.5 text-xs text-gray-700 cursor-pointer outline-none hover:bg-gray-50 rounded"
                          >
                            <Play size={14} className="mr-2 text-gray-400" />
                            Replay
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TransactionInspector
        transaction={selectedTx}
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
      />
    </div>
  )
}
