'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function DualStreamMonitor({ isRejected }: { isRejected?: boolean }) {
  // We use SVG for the sine waves
  return (
    <div className="h-full flex flex-col p-6 overflow-hidden relative bg-gray-900 rounded-xl shadow-2xl border border-gray-800">
      {/* Background glow when rejected */}
      <motion.div
        className="absolute inset-0 bg-rose-500/5 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isRejected ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      <div className="relative z-10 mb-6">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          Dual-Stream Cognitive Engine
        </h2>
        <p className="text-xs text-gray-400 mt-1">Real-time parallel execution and semantic verification.</p>
      </div>

      <div className="relative flex-1 flex flex-col justify-center gap-6 z-10 py-4">
        {/* Semantic Stream (Top) */}
        <div className="relative w-full h-8">
          <div className="absolute left-0 -top-4 text-[10px] font-mono font-semibold text-indigo-500 tracking-wider">
            SEMANTIC_STREAM
          </div>
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <motion.path
              d="M 0,16 Q 25,0 50,16 T 100,16 T 150,16 T 200,16 T 250,16 T 300,16 T 350,16 T 400,16"
              fill="transparent"
              stroke="#6366f1" // indigo-500
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0.5 }}
              animate={
                isRejected 
                  ? { 
                      d: "M 0,16 L 25,5 L 40,25 L 60,0 L 75,30 L 90,16 L 400,16",
                      stroke: "#E11D48",
                      opacity: 1
                    }
                  : {
                      pathLength: [0, 1, 1],
                      pathOffset: [0, 0, 1],
                      opacity: [0.5, 1, 0.5]
                    }
              }
              transition={
                isRejected 
                  ? { duration: 0.2, repeatType: "reverse", repeat: 3 }
                  : { duration: 3, repeat: Infinity, ease: "linear" }
              }
              vectorEffect="non-scaling-stroke"
            />
            {/* Glowing dot tracking the wave */}
            {!isRejected && (
              <motion.circle
                r="3"
                fill="#818cf8"
                filter="drop-shadow(0 0 4px #818cf8)"
                animate={{ cx: ["0%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                cy="16"
              />
            )}
          </svg>
        </div>

        {/* Runtime Stream (Bottom) */}
        <div className="relative w-full h-8 mt-4">
          <div className="absolute left-0 -top-4 text-[10px] font-mono font-semibold text-emerald-500 tracking-wider">
            RUNTIME_STREAM
          </div>
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <motion.path
              d="M 0,16 Q 30,32 60,16 T 120,16 T 180,16 T 240,16 T 300,16 T 360,16 T 420,16"
              fill="transparent"
              stroke="#059669" // emerald-500
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0.5 }}
              animate={{
                pathLength: [0, 1, 1],
                pathOffset: [0, 0, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              vectorEffect="non-scaling-stroke"
            />
            <motion.circle
              r="3"
              fill="#34d399"
              filter="drop-shadow(0 0 4px #34d399)"
              animate={{ cx: ["0%", "100%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              cy="16"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
