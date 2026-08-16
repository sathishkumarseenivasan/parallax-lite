import React from 'react'

export function Sparkline({ data, color, fillOpacity = 0.1 }: { data: number[]; color: string; fillOpacity?: number }) {
  if (!data || data.length === 0) return null
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 24 - ((d - min) / range) * 24
    return { x, y }
  })

  const pathD = `M ${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')
  
  // Create a closed path for the subtle fill
  const fillD = `${pathD} L 100,24 L 0,24 Z`

  return (
    <svg width="100%" height="28" viewBox="0 -2 100 30" preserveAspectRatio="none" className="overflow-visible">
      <path d={fillD} fill={color} fillOpacity={fillOpacity} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
