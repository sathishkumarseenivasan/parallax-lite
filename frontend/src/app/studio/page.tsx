'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SchemaBuilder } from '@/components/studio/SchemaBuilder'
import { TaskComposer } from '@/components/studio/TaskComposer'

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<'schema' | 'task'>('schema')

  return (
    <AppShell 
      title="Studio" 
      subtitle="No-code visual builders for agents"
      noPad
    >
      <div className="flex flex-col h-full bg-white">
        {/* Tabs */}
        <div className="flex items-center gap-4 px-6 border-b border-gray-200 bg-gray-50 flex-shrink-0" style={{ height: 44 }}>
          <button
            onClick={() => setActiveTab('schema')}
            className={`h-full px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'schema' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Visual Schema Builder
          </button>
          <button
            onClick={() => setActiveTab('task')}
            className={`h-full px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'task' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Task Composer
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === 'schema' ? <SchemaBuilder /> : <TaskComposer />}
        </div>
      </div>
    </AppShell>
  )
}
