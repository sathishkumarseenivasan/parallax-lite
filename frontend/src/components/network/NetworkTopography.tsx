'use client'

import React, { useMemo, useEffect, useState } from 'react'
import { Agent } from '@/lib/types'
import { motion } from 'framer-motion'

export function NetworkTopography({ agents }: { agents: Agent[] }) {
  // Deterministic deterministic random placements for the network nodes
  const nodes = useMemo(() => {
    return agents.map((agent, i) => {
      // Create a deterministic position based on agent ID hash
      const hash = agent.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const x = 10 + (hash * 13 % 80) // 10% to 90%
      const y = 10 + (hash * 17 % 80)
      
      const score = agent.trust_score ?? (agent.role === 'buyer' ? 95 : 70)
      const color = score >= 85 ? '#3b82f6' : score >= 60 ? '#10b981' : '#ef4444' // Blue, Green, Red
      const glow = score >= 85 ? 'rgba(59, 130, 246, 0.4)' : score >= 60 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'

      return {
        ...agent,
        x, y,
        color, glow,
        size: Math.max(20, Math.min(50, 20 + ((agent.total_transactions || 0) / 10))), // Size by volume
        score
      }
    })
  }, [agents])

  // Generate some logical edges (buyer -> seller/scraper)
  const edges = useMemo(() => {
    const lines: any[] = []
    const buyers = nodes.filter(n => n.role === 'buyer')
    const sellers = nodes.filter(n => n.role !== 'buyer')
    
    buyers.forEach(buyer => {
      sellers.forEach(seller => {
        // Connect buyer to seller if deterministic condition met
        if ((buyer.total_transactions + seller.total_transactions) % 3 !== 0) {
          lines.push({ source: buyer, target: seller, active: Math.random() > 0.5 })
        }
      })
    })
    return lines
  }, [nodes])

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="box w-full h-[300px] bg-gray-900 relative overflow-hidden flex items-center justify-center border-gray-800">
      <div className="absolute top-4 left-4 z-20">
        <h3 className="text-sm font-semibold text-white">Network Topography</h3>
        <p className="text-xs text-gray-400 font-mono mt-1">Entropy-weighted Graph Visualization</p>
      </div>

      <svg className="w-full h-full absolute inset-0 z-0">
        {edges.map((edge, i) => (
          <motion.line
            key={i}
            x1={`${edge.source.x}%`} y1={`${edge.source.y}%`}
            x2={`${edge.target.x}%`} y2={`${edge.target.y}%`}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: i * 0.1 }}
          />
        ))}
        {edges.map((edge, i) => edge.active && (
          <motion.circle
            key={`dot-${i}`}
            r={2}
            fill="#818cf8"
            initial={{ cx: `${edge.source.x}%`, cy: `${edge.source.y}%` }}
            animate={{ cx: `${edge.target.x}%`, cy: `${edge.target.y}%` }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
          />
        ))}
      </svg>

      {nodes.map(node => (
        <motion.div
          key={node.id}
          className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          whileHover={{ scale: 1.1 }}
        >
          <div
            className="rounded-full shadow-lg border-2 border-white/20 flex items-center justify-center font-bold text-white shadow-current"
            style={{ 
              width: node.size, height: node.size,
              backgroundColor: node.color,
              boxShadow: `0 0 15px ${node.glow}, inset 0 0 10px rgba(0,0,0,0.2)`
            }}
            title={`${node.name} | Score: ${node.score}%`}
          >
            {node.name[0].toUpperCase()}
          </div>
          <div className="bg-gray-900/80 backdrop-blur-sm text-[10px] text-gray-300 px-1.5 py-0.5 rounded mt-1 border border-gray-700 whitespace-nowrap">
            {node.id}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
