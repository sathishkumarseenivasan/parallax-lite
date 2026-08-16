'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export function AnimatedBorder({
  children,
  className,
  wrapperClassName,
}: {
  children: React.ReactNode
  className?: string
  wrapperClassName?: string
}) {
  return (
    <div className={cn('relative p-[1px] rounded-full overflow-hidden inline-flex items-center justify-center', wrapperClassName)}>
      <div className="absolute inset-0 bg-[conic-gradient(from_var(--conic-angle),transparent_0%,#475569_50%,transparent_100%)] animate-conic-spin" />
      <div className={cn('relative bg-white rounded-full', className)}>
        {children}
      </div>
    </div>
  )
}
