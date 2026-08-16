'use client'

/**
 * ClearedVsRejectedChart — Premium AreaChart data viz.
 * Shows Cleared vs Rejected Volume over Time (mocked using metrics if historical not available).
 */
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { Metrics } from '@/lib/types'

export function ClearedVsRejectedChart({ metrics }: { metrics: Metrics }) {
  // We mock a timeline since metrics doesn't provide historical data directly here
  const data = [
    { time: '10:00', cleared: Math.floor(metrics.cleared_count * 0.1), rejected: Math.floor(metrics.rejected_count * 0.1) },
    { time: '10:05', cleared: Math.floor(metrics.cleared_count * 0.3), rejected: Math.floor(metrics.rejected_count * 0.2) },
    { time: '10:10', cleared: Math.floor(metrics.cleared_count * 0.5), rejected: Math.floor(metrics.rejected_count * 0.5) },
    { time: '10:15', cleared: Math.floor(metrics.cleared_count * 0.8), rejected: Math.floor(metrics.rejected_count * 0.7) },
    { time: 'Now',   cleared: metrics.cleared_count, rejected: metrics.rejected_count },
  ]

  const total = metrics.cleared_count + metrics.rejected_count

  return (
    <div className="card-premium h-full flex flex-col p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900">Settlement Volume</h2>
        <p className="text-xs text-gray-500 mt-1">Cleared vs Rejected transactions over time.</p>
      </div>

      <div className="flex-1 min-h-[200px] -ml-4">
        {total === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSlate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dx={-10} />
              
              <Tooltip 
                cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload, label, coordinate }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div 
                        className="bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700 p-3 min-w-[120px] transition-transform duration-200 ease-out"
                      >
                        <p className="text-xs font-semibold text-gray-300 mb-2">{label}</p>
                        {payload.map((entry, index) => (
                          <div key={index} className="flex items-center justify-between gap-4 mb-1 text-[11px]">
                            <span className="flex items-center gap-1.5 font-medium text-gray-300">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              {entry.name}
                            </span>
                            <span className="font-mono font-semibold">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              
              <Area type="monotone" dataKey="cleared" name="Cleared" stroke="#64748b" strokeWidth={2} fillOpacity={1} fill="url(#colorSlate)" />
              <Area type="monotone" dataKey="rejected" name="Rejected" stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export function ClearedVsRejectedChartSkeleton() {
  return (
    <div className="card-premium h-full flex flex-col p-6">
      <div className="w-32 h-4 skeleton-shimmer rounded mb-2" />
      <div className="w-48 h-3 skeleton-shimmer rounded mb-6" />
      <div className="flex-1 skeleton-shimmer rounded" />
    </div>
  )
}
