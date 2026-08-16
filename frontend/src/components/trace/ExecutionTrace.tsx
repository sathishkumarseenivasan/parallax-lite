'use client'
/**
 * ExecutionTrace — Datadog APM-style vertical timeline with expandable accordions.
 * Each node shows duration, method, and status code. Clicking expands HTTP headers + payload.
 */
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PragmaticTx, TraceStep } from '@/lib/mock-pragmatic-data'

const COLOR_MAP: Record<TraceStep['color'], { dot: string; badge: string; text: string; border: string }> = {
  gray:    { dot: '#9CA3AF', badge: 'trace-node-gray',    text: '#374151', border: '#D1D5DB' },
  amber:   { dot: '#D97706', badge: 'trace-node-amber',   text: '#92400E', border: '#FDE68A' },
  indigo:  { dot: '#4F46E5', badge: 'trace-node-indigo',  text: '#3730A3', border: '#C7D2FE' },
  emerald: { dot: '#059669', badge: 'trace-node-emerald', text: '#065F46', border: '#A7F3D0' },
  rose:    { dot: '#E11D48', badge: 'bg-rose-50 border-rose-200 text-rose-800', text: '#991B1B', border: '#FECACA' },
}

const STATUS_COLORS: Record<number, string> = {
  200: '#059669', 201: '#059669', 422: '#E11D48', 402: '#D97706',
}

interface Props { tx: PragmaticTx }

export function ExecutionTrace({ tx }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const totalMs = tx.trace.reduce((s, t) => s + t.durationMs, 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Execution Trace</h3>
        <span className="font-mono text-xs text-gray-500">{totalMs}ms total</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Waterfall width reference */}
        <div className="relative">
          {tx.trace.map((step, idx) => {
            const isOpen   = expanded.has(step.id)
            const isLast   = idx === tx.trace.length - 1
            const colors   = COLOR_MAP[step.color]
            const barWidth = totalMs > 0 ? (step.durationMs / totalMs) * 100 : 0

            return (
              <div key={step.id} className="relative">
                {/* Vertical connector */}
                {!isLast && (
                  <div
                    className="absolute left-[11px] top-7 w-px bg-gray-200"
                    style={{ height: isOpen ? 'calc(100% - 8px)' : 40 }}
                  />
                )}

                {/* Step row */}
                <button
                  onClick={() => toggle(step.id)}
                  className="w-full flex items-start gap-3 py-2 text-left hover:bg-gray-50 rounded-md px-1 transition-colors group"
                >
                  {/* Dot */}
                  <div
                    className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center"
                    style={{ borderColor: colors.dot, background: '#fff' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: colors.dot }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Label row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {step.method && (
                        <span className="font-mono text-xs font-semibold" style={{ color: '#6B7280' }}>
                          {step.method}
                        </span>
                      )}
                      <span className="text-xs font-medium text-gray-800 truncate">{step.label}</span>
                      {step.statusCode && (
                        <span
                          className="font-mono text-xs font-semibold"
                          style={{ color: STATUS_COLORS[step.statusCode] ?? '#6B7280' }}
                        >
                          {step.statusCode}
                        </span>
                      )}
                      {step.durationMs > 0 && (
                        <span className="ml-auto font-mono text-xs text-gray-400 flex-shrink-0">
                          {step.durationMs}ms
                        </span>
                      )}
                    </div>

                    {/* Waterfall bar */}
                    {step.durationMs > 0 && (
                      <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${barWidth}%`, background: colors.dot, opacity: 0.7 }}
                        />
                      </div>
                    )}

                    {/* Path */}
                    {step.path && (
                      <p className="font-mono text-xs text-gray-400 mt-0.5">{step.path}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0 mt-0.5 text-gray-400 group-hover:text-gray-600 transition-colors">
                    {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </div>
                </button>

                {/* Accordion */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="overflow-hidden ml-8"
                    >
                      <div
                        className="mb-3 rounded-md border text-xs overflow-hidden"
                        style={{ borderColor: colors.border }}
                      >
                        {/* Headers */}
                        <div
                          className="px-3 py-2 border-b"
                          style={{ background: `${colors.dot}0A`, borderColor: colors.border }}
                        >
                          <p className="font-semibold uppercase tracking-wider text-gray-500 mb-2" style={{ fontSize: 10 }}>
                            HTTP Headers
                          </p>
                          <div className="space-y-0.5">
                            {Object.entries(step.headers).map(([k, v]) => (
                              <div key={k} className="flex gap-2 font-mono">
                                <span className="text-gray-500 flex-shrink-0">{k}:</span>
                                <span className="text-gray-800 truncate">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Payload / Response */}
                        {(step.payload ?? step.response) && (
                          <div className="px-3 py-2">
                            <p className="font-semibold uppercase tracking-wider text-gray-500 mb-2" style={{ fontSize: 10 }}>
                              {step.payload ? 'Request Payload' : 'Response Body'}
                            </p>
                            <pre className="font-mono text-gray-800 whitespace-pre-wrap break-all leading-relaxed" style={{ fontSize: 11 }}>
                              {JSON.stringify(step.payload ?? step.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
