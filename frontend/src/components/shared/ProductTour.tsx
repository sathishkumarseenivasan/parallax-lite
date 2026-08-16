'use client'

import { useEffect, useState } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

interface TourStep {
  target: string
  title: string
  content: string
}

const TOUR_STEPS: TourStep[] = [
  { target: '.metrics-hero', title: 'Metrics Hero', content: 'Monitor real-time network health, clearance rates, and funds saved from semantic drift.' },
  { target: '.vault-ledger', title: 'Vault Ledger', content: 'Every transaction is escrowed and validated here before settlement.' },
  { target: '.inspector-trigger', title: 'Drift Inspector', content: 'Click any row to open the forensic inspector and trace the transaction lifecycle.' },
  { target: '.verdict-tab', title: 'Verdict Engine', content: 'See the exact entropy score, latency penalty, and semantic reasoning for each settlement.' },
  { target: '.finality-map', title: 'Finality Map', content: 'Track the flow of funds through the tri-stage validation cascade.' },
  { target: '.playground-nav', title: 'Playground', content: 'Test your agent schemas and simulate task submissions in a safe sandbox.' }
]

export function ProductTour() {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const hasSeen = localStorage.getItem('parallax_tour_seen')
    if (!hasSeen) {
      // Small delay to let DOM render
      setTimeout(() => setActive(true), 1000)
    }

    const handleStartTour = () => {
      setStepIndex(0)
      setActive(true)
    }

    window.addEventListener('start_tour', handleStartTour)
    return () => window.removeEventListener('start_tour', handleStartTour)
  }, [])

  useEffect(() => {
    if (!active) return

    const updateRect = () => {
      const step = TOUR_STEPS[stepIndex]
      const el = document.querySelector(step.target)
      if (el) {
        setTargetRect(el.getBoundingClientRect())
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        setTargetRect(null)
      }
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [active, stepIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!active) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [active, stepIndex])

  const handleClose = () => {
    setActive(false)
    localStorage.setItem('parallax_tour_seen', 'true')
  }

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) setStepIndex(stepIndex + 1)
    else handleClose()
  }

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1)
  }

  if (!active) return null

  const step = TOUR_STEPS[stepIndex]
  const isLast = stepIndex === TOUR_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none transition-all duration-300">
      {/* Dimmed Overlay */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={handleClose} />

      {/* Spotlight cutout */}
      {targetRect && (
        <div 
          className="absolute bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] pointer-events-none transition-all duration-300 rounded-lg border-2 border-indigo-500"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16
          }}
        />
      )}

      {/* Tour Dialog */}
      <div 
        className="absolute bg-white rounded-md shadow-xl border border-gray-200 w-80 pointer-events-auto transition-all duration-300"
        style={{
          top: targetRect ? Math.max(16, targetRect.bottom + 16) : '50%',
          left: targetRect ? Math.max(16, Math.min(window.innerWidth - 336, targetRect.left)) : '50%',
          transform: targetRect ? 'none' : 'translate(-50%, -50%)'
        }}
      >
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-900 transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            {step.content}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400">
              {stepIndex + 1} / {TOUR_STEPS.length}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={handlePrev} 
                disabled={stepIndex === 0}
                className="p-1.5 rounded-sm hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNext}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-medium transition-colors flex items-center gap-1"
              >
                {isLast ? 'Finish' : 'Next'}
                {!isLast && <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
