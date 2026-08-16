'use client'

import { useState, useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { formatCredits } from '@/lib/utils'
import type { Metrics } from '@/lib/types'
import { SpotlightCard } from '@/components/ui/SpotlightCard'

interface FundsSavedHeroProps {
  metrics: Metrics
}

function AnimatedNumber({ value }: { value: number }) {
  // Use framer-motion spring for counting up animation
  const spring = useSpring(0, {
    stiffness: 40,
    damping: 15,
    mass: 1,
  })

  // Format the number to keep the string beautiful
  const formatted = useTransform(spring, (current) => formatCredits(current))

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  return <motion.span>{formatted}</motion.span>
}

export function FundsSavedHero({ metrics }: FundsSavedHeroProps) {
  return (
    <SpotlightCard className="h-full flex flex-col justify-between p-8 group">
      {/* Subtle premium mesh gradient & noise overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-white to-white pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />
      
      {/* Top section: Title and Badge */}
      <div className="relative z-10 flex items-start justify-between mb-8">
        <div>
          <h2 className="text-sm font-semibold text-gray-600 tracking-tight flex items-center gap-2">
            Total Funds Saved
            <span className="text-xs text-gray-400 font-normal">from Hallucinations</span>
          </h2>
        </div>
        
        {/* Pulsing "Live Protection Active" badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100/50 shadow-sm">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase text-emerald-700">Live Protection</span>
        </div>
      </div>

      {/* Main Metric */}
      <div className="relative z-10 mt-auto">
        <div className="flex items-baseline gap-2">
          <div className="text-5xl md:text-6xl font-bold tracking-tighter font-mono text-gray-900 tabular-nums">
            <AnimatedNumber value={metrics.total_funds_saved} />
          </div>
          <span className="text-2xl font-medium text-gray-400 tracking-tight">cr</span>
        </div>
        <p className="text-sm text-gray-500 mt-3 max-w-sm">
          Protected {metrics.rejected_count} agent interactions from semantic drift, preventing waste.
        </p>
      </div>
    </SpotlightCard>
  )
}
