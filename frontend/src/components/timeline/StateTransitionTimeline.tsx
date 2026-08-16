'use client'

/**
 * StateTransitionTimeline
 *
 * An SVG + Framer Motion horizontal lifecycle timeline that renders the
 * four Parallax stages: Escrow Locked → Schema Intercepted → Semantic
 * Verified → Settlement Cleared.
 *
 * Behaviours:
 * - CLEARED stages: solid Emerald line, static checkmark node
 * - ACTIVE stage:   Amber pulsing dot, animated pulse traveling the line
 * - REJECTED stage: Vivid Rose line, fracture animation, ✕ node
 * - PENDING stages: stone gray, no animation
 */

import React, { useId } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Lock, Code, Brain, Banknote } from 'lucide-react'
import type { TimelineStage, LifecycleStage } from '@/lib/mock-state-data'

/* ── Constants ─────────────────────────────────────────────────────────────── */
const STAGE_ICONS: Record<LifecycleStage, React.ElementType> = {
  ESCROW_LOCKED:      Lock,
  SCHEMA_INTERCEPTED: Code,
  SEMANTIC_VERIFIED:  Brain,
  SETTLEMENT_CLEARED: Banknote,
}

const STATUS_COLORS = {
  cleared:  { line: '#059669', node: '#059669', text: '#059669', ring: 'rgba(5,150,105,0.18)' },
  rejected: { line: '#E11D48', node: '#E11D48', text: '#E11D48', ring: 'rgba(225,29,72,0.18)' },
  active:   { line: '#D97706', node: '#D97706', text: '#D97706', ring: 'rgba(217,119,6,0.18)' },
  pending:  { line: '#D4D0CB', node: '#FAFAF9',  text: '#A8A29E', ring: 'transparent' },
} as const

/* ── Sub-components ─────────────────────────────────────────────────────────── */

interface NodeProps {
  stage: TimelineStage
  isFirst: boolean
  isLast: boolean
  compact?: boolean
}

function TimelineNode({ stage, compact }: NodeProps) {
  const { status } = stage
  const colors = STATUS_COLORS[status]
  const Icon = STAGE_ICONS[stage.id]

  const nodeSize  = compact ? 32 : 36
  const iconSize  = compact ? 13 : 15
  const ringSize  = nodeSize + 8

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Node circle */}
      <div
        className="relative flex items-center justify-center rounded-full transition-all duration-500"
        style={{
          width:  nodeSize,
          height: nodeSize,
          background: status === 'pending'
            ? '#F5F5F4'
            : status === 'active'
              ? '#FFFBEB'
              : status === 'rejected'
                ? '#FFF1F2'
                : '#ECFDF5',
          border: `1.5px solid ${status === 'pending' ? '#D4D0CB' : colors.node}`,
          boxShadow: status !== 'pending' ? `0 0 0 4px ${colors.ring}` : undefined,
        }}
      >
        {/* Pulse ring for active */}
        {status === 'active' && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width:  ringSize,
              height: ringSize,
              border: '1.5px solid #D97706',
              top:    -4,
              left:   -4,
            }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Status icon overlay */}
        {status === 'cleared' && (
          <Check size={iconSize} strokeWidth={2.5} style={{ color: colors.node }} />
        )}
        {status === 'rejected' && (
          <X size={iconSize} strokeWidth={2.5} style={{ color: colors.node }} />
        )}
        {(status === 'active' || status === 'pending') && (
          <Icon size={iconSize} strokeWidth={1.8} style={{ color: colors.text }} />
        )}
      </div>

      {/* Label below node */}
      {!compact && (
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap"
            style={{ color: colors.text }}
          >
            {stage.shortLabel}
          </span>
          {stage.durationMs != null && (
            <span className="text-[9px] font-mono text-stone-400">
              {stage.durationMs}ms
            </span>
          )}
        </div>
      )}
    </div>
  )
}

interface ConnectorProps {
  fromStatus: TimelineStage['status']
  toStatus:   TimelineStage['status']
  isRejected: boolean
  /** Index of this connector (0-based) */
  idx: number
}

function TimelineConnector({ fromStatus, toStatus, isRejected }: ConnectorProps) {
  const uid = useId()
  const isClearedSegment = fromStatus === 'cleared' && toStatus !== 'pending'
  const isActiveSegment  = fromStatus === 'cleared' && toStatus === 'active'
    || fromStatus === 'active'
  const isFracture       = isRejected && ((fromStatus as string) === 'rejected' || toStatus === 'pending' && (fromStatus as string) === 'rejected')

  // Decide line color
  let lineColor = '#D4D0CB' // pending
  if (isFracture)       lineColor = '#E11D48'
  else if (fromStatus === 'cleared' && (toStatus === 'cleared' || toStatus === 'active')) lineColor = '#059669'
  else if (isActiveSegment) lineColor = '#D97706'

  const showPulse = fromStatus === 'cleared' && toStatus === 'active'
    || (fromStatus === 'active' && toStatus === 'pending')
    || fromStatus === 'active'

  return (
    <div className="relative flex-1 flex items-center" style={{ minWidth: 32 }}>
      {/* Base line */}
      <div
        className="w-full transition-all duration-700"
        style={{
          height: 2,
          borderRadius: 9999,
          background: lineColor,
          opacity: isFracture ? undefined : 1,
        }}
      />

      {/* Fracture animation overlay */}
      {isFracture && (
        <motion.div
          className="absolute inset-0"
          style={{ height: 2, top: 0, borderRadius: 9999, background: '#E11D48' }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Traveling pulse */}
      {showPulse && !isRejected && (
        <motion.div
          key={uid}
          className="absolute top-1/2 -trangray-y-1/2"
          style={{
            width:  20,
            height: 4,
            borderRadius: 9999,
            background: 'linear-gradient(90deg, transparent, #D97706, transparent)',
            left: 0,
          }}
          animate={{ x: ['0%', '500%'] }}
          transition={{
            duration: 1.6,
            repeat:   Infinity,
            ease:     'easeInOut',
            repeatDelay: 0.4,
          }}
        />
      )}

      {/* Cleared segment fill animation (plays once on mount) */}
      {isClearedSegment && !isRejected && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ height: 2, top: 0, background: '#059669' }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────────────────────── */

interface StateTransitionTimelineProps {
  stages: TimelineStage[]
  /** Compact mode — no labels, tighter spacing (for table rows) */
  compact?: boolean
  className?: string
}

export function StateTransitionTimeline({
  stages,
  compact = false,
  className = '',
}: StateTransitionTimelineProps) {
  const hasRejection = stages.some((s) => s.status === 'rejected')

  // Find where rejection begins
  const rejectionIdx = stages.findIndex((s) => s.status === 'rejected')

  return (
    <div
      className={`flex items-center w-full ${compact ? 'gap-1' : 'gap-2'} ${className}`}
      role="list"
      aria-label="Transaction lifecycle stages"
    >
      {stages.map((stage, i) => {
        const isLast    = i === stages.length - 1
        const nextStage = stages[i + 1]

        // Is this connector segment after the rejection point?
        const connectorIsPostRejection =
          hasRejection && rejectionIdx !== -1 && i >= rejectionIdx

        return (
          <React.Fragment key={stage.id}>
            {/* Node */}
            <div role="listitem" aria-label={`${stage.label}: ${stage.status}`}>
              <TimelineNode
                stage={stage}
                isFirst={i === 0}
                isLast={isLast}
                compact={compact}
              />
            </div>

            {/* Connector (not after last node) */}
            {!isLast && (
              <TimelineConnector
                fromStatus={stage.status}
                toStatus={nextStage.status}
                isRejected={connectorIsPostRejection || stage.status === 'rejected'}
                idx={i}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ── Standalone Full View ─────────────────────────────────────────────────── */
/**
 * TimelineDetailPanel — the full, labeled timeline used in the Drift Inspector
 * and the main State View. Shows all 4 nodes + labels + durations.
 */
export function TimelineDetailPanel({
  stages,
  transactionId,
}: {
  stages: TimelineStage[]
  transactionId: string
}) {
  const hasRejection = stages.some((s) => s.status === 'rejected')

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
          State Lifecycle
        </span>
        <span className="text-[10px] font-mono text-stone-400">
          {transactionId}
        </span>
      </div>

      {/* Timeline bar */}
      <div className="px-2">
        <StateTransitionTimeline stages={stages} compact={false} />
      </div>

      {/* Stage detail list */}
      <div className="mt-6 space-y-1">
        {stages.map((stage) => {
          const colors = STATUS_COLORS[stage.status]
          return (
            <div
              key={stage.id}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors"
              style={{
                background: stage.status === 'rejected'
                  ? 'rgba(225,29,72,0.04)'
                  : stage.status === 'cleared'
                    ? 'rgba(5,150,105,0.03)'
                    : 'transparent',
              }}
            >
              <div
                className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: colors.node, marginTop: 6 }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: colors.text }}
                  >
                    {stage.label}
                  </span>
                  {stage.durationMs != null && (
                    <span className="text-[10px] font-mono text-stone-400">
                      +{stage.durationMs}ms
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                  {stage.description}
                </p>
              </div>
              {stage.timestamp && (
                <span className="text-[10px] font-mono text-stone-400 flex-shrink-0 mt-0.5">
                  {new Date(stage.timestamp).toLocaleTimeString('en-GB', {
                    hour:   '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Rejection callout */}
      {hasRejection && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-4 px-4 py-3 rounded-lg border"
          style={{
            background: 'rgba(225,29,72,0.05)',
            borderColor: 'rgba(225,29,72,0.2)',
          }}
        >
          <p className="text-[11px] font-semibold text-rose-700">
            ⚠ Semantic Drift Detected — Settlement Blocked
          </p>
          <p className="text-[11px] text-rose-600 mt-0.5 leading-relaxed">
            The agent&apos;s output failed schema validation. Funds remain in escrow.
            Review the Drift Inspector for the exact mismatch.
          </p>
        </motion.div>
      )}
    </div>
  )
}
