'use client'
/**
 * AgentTelemetry — Dual-axis Recharts line chart.
 * Left Y-axis: Semantic Confidence (0–100%). Right Y-axis: Latency (ms).
 * Includes time-range selector and custom dark tooltip.
 */
import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { useStore } from '@/providers/useStore'

const RANGES = [
  { label: '1h',  points: 15 },
  { label: '6h',  points: 40 },
  { label: '24h', points: 70 },
  { label: '7d',  points: 100 },
]

interface TooltipPayloadEntry {
  dataKey: string
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string | number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="text-xs rounded-md border py-2 px-3 shadow-tooltip"
      style={{ background: '#1F2937', border: '1px solid #374151', color: '#F9FAFB', minWidth: 160 }}
    >
      <p className="font-mono text-gray-400 mb-1.5" style={{ fontSize: 10 }}>
        TX #{label}
      </p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            <span style={{ color: '#D1D5DB' }}>{p.name}</span>
          </div>
          <span className="font-mono font-medium" style={{ color: '#F9FAFB' }}>
            {p.dataKey === 'confidence' ? `${p.value.toFixed(1)}%` : `${Math.round(p.value)}ms`}
          </span>
        </div>
      ))}
    </div>
  )
}

export function AgentTelemetry() {
  const [range, setRange] = useState('24h')
  const storeTelemetry = useStore(state => state.telemetry)

  const data = useMemo(() => {
    const pts = RANGES.find(r => r.label === range)?.points ?? 70
    return storeTelemetry.slice(-pts)
  }, [range, storeTelemetry])

  const avgConf = useMemo(() =>
    data.reduce((s, d) => s + d.confidence, 0) / data.length, [data])
  const avgLat  = useMemo(() =>
    data.reduce((s, d) => s + d.latency_ms, 0) / data.length, [data])

  return (
    <div className="box">
      {/* Header */}
      <div className="box-header">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-900">Agent Telemetry</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: '#4F46E5' }} />
              Semantic Confidence
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: '#D97706' }} />
              Latency
            </span>
          </div>
        </div>
        {/* Stat pills + range selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono" style={{ color: '#4F46E5' }}>
              avg {avgConf.toFixed(1)}%
            </span>
            <span className="text-gray-300">|</span>
            <span className="font-mono" style={{ color: '#D97706' }}>
              avg {Math.round(avgLat)}ms
            </span>
          </div>
          <div className="flex items-center border border-gray-200 rounded overflow-hidden">
            {RANGES.map(r => (
              <button
                key={r.label}
                onClick={() => setRange(r.label)}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background: range === r.label ? '#4F46E5' : '#fff',
                  color: range === r.label ? '#fff' : '#6B7280',
                  borderRight: r.label !== '7d' ? '1px solid #E5E7EB' : 'none',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220, padding: '16px 8px 8px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="index"
              tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(v) => `#${v}`}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              width={38}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}ms`}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
            <ReferenceLine yAxisId="left" y={80} stroke="#4F46E5" strokeDasharray="4 2" strokeOpacity={0.25} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="confidence"
              name="Confidence"
              stroke="#4F46E5"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="latency_ms"
              name="Latency"
              stroke="#D97706"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: '#D97706', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
