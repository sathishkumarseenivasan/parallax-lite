'use client'

import React, { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  fromColor?: string
}

export function SpotlightCard({
  children,
  className,
  fromColor = 'rgba(16,185,129,0.15)',
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    
    const rect = divRef.current.getBoundingClientRect()
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseEnter = () => setOpacity(1)
  const handleMouseLeave = () => setOpacity(0)

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn('relative overflow-hidden card-premium', className)}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(circle 400px at ${position.x}px ${position.y}px, ${fromColor}, transparent 50%)`,
        }}
      />
      
      {/* Inner border highlight for glass effect */}
      <div className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none z-10 mix-blend-overlay" />
      
      <div className="relative z-20 h-full">{children}</div>
    </div>
  )
}
