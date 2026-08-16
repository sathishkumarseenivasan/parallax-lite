'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { truncateId } from '@/lib/utils'

interface MarqueeItem {
  id: string
  buyer: string
  seller: string
  amount: number
  status: 'CLEARED' | 'REJECTED' | 'LOCKED'
}

// Dummy data or we could pass it in. For this, we'll use a fast infinite scroll.
const FAKE_STREAM: MarqueeItem[] = [
  { id: '8a9fa1', buyer: 'Agent_Alpha', seller: 'Agent_Beta', amount: 0.004, status: 'CLEARED' },
  { id: 'b2c3d4', buyer: 'Agent_Gamma', seller: 'Agent_Delta', amount: 1.25, status: 'LOCKED' },
  { id: 'e5f6g7', buyer: 'Agent_Epsilon', seller: 'Agent_Zeta', amount: 0.001, status: 'CLEARED' },
  { id: 'h8i9j0', buyer: 'Agent_Eta', seller: 'Agent_Theta', amount: 0.5, status: 'REJECTED' },
  { id: 'k1l2m3', buyer: 'Agent_Iota', seller: 'Agent_Kappa', amount: 3.14, status: 'CLEARED' },
  { id: 'n4o5p6', buyer: 'Agent_Lambda', seller: 'Agent_Mu', amount: 0.02, status: 'CLEARED' },
]

export function SettlementMarquee() {
  return (
    <div className="w-full bg-gray-900 border-b border-gray-800 overflow-hidden py-1.5 flex items-center relative z-20">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent z-10" />
      
      <div className="flex w-[200%] animate-marquee hover:[animation-play-state:paused]">
        {/* Double the list for seamless loop */}
        {[...FAKE_STREAM, ...FAKE_STREAM].map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-6 text-[11px] font-mono whitespace-nowrap text-gray-400"
          >
            <span className="text-gray-500">[TX_{item.id}]</span>
            <span className="text-gray-300">
              {item.buyer} <span className="text-gray-600">→</span> {item.seller}
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-300">{item.amount} USDC</span>
            <span className="text-gray-500">|</span>
            {item.status === 'CLEARED' && <span className="text-emerald-400">CLEARED ✅</span>}
            {item.status === 'REJECTED' && <span className="text-rose-400">REJECTED ❌</span>}
            {item.status === 'LOCKED' && <span className="text-amber-400">LOCKED 🔒</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
