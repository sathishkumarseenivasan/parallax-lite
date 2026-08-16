'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

export function MagneticButton({ 
  children, 
  className, 
  onClick, 
  disabled,
  type = 'button' 
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null)
  
  // Motion values for x and y
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  // Apply spring physics for tactile, weighty feel
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 })
  
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    
    // Calculate distance from center
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    // Move up to 8px towards the cursor
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY
    
    x.set(distanceX * 0.2)
    y.set(distanceY * 0.2)
  }
  
  const handleMouseLeave = () => {
    if (disabled) return
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      type={type}
      style={{ x: springX, y: springY }}
      className={cn(className)}
    >
      {children}
    </motion.button>
  )
}
