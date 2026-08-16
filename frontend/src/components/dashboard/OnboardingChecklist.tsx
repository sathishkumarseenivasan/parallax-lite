'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { api } from '@/lib/api'

interface OnboardingState {
  booted: boolean
  agent_created: boolean
  session_funded: boolean
  schema_defined: boolean
  task_submitted: boolean
  verdict_viewed: boolean
  badge_copied: boolean
}

export function OnboardingChecklist() {
  const [state, setState] = useState<OnboardingState | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await api.get('/onboarding/state')
        setState(res as OnboardingState)
      } catch (err) {
        console.error('Failed to fetch onboarding state:', err)
      }
    }
    fetchState()
    
    // Auto-refresh state every 3 seconds to auto-complete steps
    const interval = setInterval(fetchState, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!state || dismissed) return null

  const steps = [
    { key: 'booted', label: 'Boot the stack' },
    { key: 'agent_created', label: 'Create your first agent' },
    { key: 'session_funded', label: 'Fund a session key' },
    { key: 'schema_defined', label: 'Define a schema' },
    { key: 'task_submitted', label: 'Submit your first task' },
    { key: 'verdict_viewed', label: 'Watch the verdict live' },
    { key: 'badge_copied', label: 'Claim your badge' }
  ]

  const completedCount = steps.filter(s => state[s.key as keyof OnboardingState]).length
  const totalCount = steps.length
  const allComplete = completedCount === totalCount

  return (
    <div className="box mb-5 relative bg-white border border-gray-200 shadow-sm overflow-hidden rounded-md">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 h-1 bg-gray-100 w-full">
        <div 
          className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-4 mt-1">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {allComplete ? "You're live. The referee is watching your swarm." : "Get started"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {completedCount} of {totalCount} steps complete
            </p>
          </div>
          {allComplete && (
            <button 
              onClick={() => setDismissed(true)}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, idx) => {
            const isDone = state[step.key as keyof OnboardingState]
            return (
              <div key={step.key} className="flex items-center gap-2">
                {isDone ? (
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle size={16} className="text-gray-300 flex-shrink-0" />
                )}
                <span className={`text-sm ${isDone ? 'text-gray-900' : 'text-gray-500'}`}>
                  {idx + 1}. {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
