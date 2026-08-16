'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

interface FieldDef {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  constraints: { gt?: number; lt?: number }
}

export function SchemaBuilder() {
  const [name, setName] = useState('MyCustomSchema')
  const [fields, setFields] = useState<FieldDef[]>([
    { id: 'f1', name: 'result', type: 'string', required: true, constraints: {} }
  ])
  const [testPayload, setTestPayload] = useState('{\n  "result": "success"\n}')
  const [testResult, setTestResult] = useState<{is_valid: boolean; errors: string[]; time_ms: number} | null>(null)
  
  const addField = () => {
    setFields([...fields, { 
      id: Math.random().toString(), 
      name: `field_${fields.length + 1}`, 
      type: 'string', 
      required: false, 
      constraints: {} 
    }])
  }

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id))
  }

  const updateField = (id: string, key: keyof FieldDef, value: string | boolean) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f))
  }

  const updateConstraint = (id: string, cKey: string, value: string) => {
    setFields(fields.map(f => {
      if (f.id !== id) return f
      const val = value ? parseFloat(value) : undefined
      return { ...f, constraints: { ...f.constraints, [cKey]: val } }
    }))
  }

  const handleSave = async () => {
    try {
      await api.post('/schemas', { name, fields })
      api.post('/onboarding/event', { event_name: 'schema_defined' }).catch(() => {})
      toast.success('Schema saved successfully')
    } catch (err: unknown) {
      if ((err as Record<string, unknown>)?.error === 'PLX-SCHEMA-01') {
        toast.error(`Invalid constraint: ${(err as Record<string, unknown>).msg}`)
      } else {
        toast.error('Failed to save schema')
      }
    }
  }

  const handleTest = async () => {
    try {
      // First save it temporarily to backend if needed, but we can also use playground /validate
      // Actually playground /validate takes schema_name. We must save first.
      await api.post('/schemas', { name, fields })
      const res = await api.post('/playground/validate', {
        schema_name: name,
        raw_output: testPayload
      })
      setTestResult(res as {is_valid: boolean; errors: string[]; time_ms: number})
    } catch (err: unknown) {
      toast.error('Test failed')
    }
  }

  // Generate preview
  const preview = {
    title: name,
    type: 'object',
    properties: fields.reduce((acc, f) => {
      acc[f.name] = { type: f.type, ...f.constraints }
      return acc
    }, {} as Record<string, unknown>),
    required: fields.filter(f => f.required).map(f => f.name)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Builder Side */}
      <div className="flex flex-col gap-4">
        <div className="box p-5 bg-white border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Schema Definition</h2>
            <button 
              onClick={handleSave}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition"
            >
              Save Schema
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-700 mb-1">Schema Name</label>
            <input 
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-700">Fields</label>
              <button onClick={addField} className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:text-indigo-800">
                <Plus size={14} /> Add Field
              </button>
            </div>
            
            {fields.map(f => (
              <div key={f.id} className="p-3 border border-gray-100 bg-gray-50 rounded flex flex-col gap-2 relative group">
                <button 
                  onClick={() => removeField(f.id)} 
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={14} />
                </button>
                
                <div className="grid grid-cols-2 gap-3 pr-6">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Name</label>
                    <input 
                      value={f.name} onChange={e => updateField(f.id, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Type</label>
                    <select 
                      value={f.type} onChange={e => updateField(f.id, 'type', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-1">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input 
                      type="checkbox" checked={f.required} 
                      onChange={e => updateField(f.id, 'required', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Required
                  </label>
                  
                  {f.type === 'number' && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">gt:</span>
                        <input 
                          type="number" 
                          value={f.constraints.gt ?? ''} 
                          onChange={e => updateConstraint(f.id, 'gt', e.target.value)}
                          className="w-12 border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">lt:</span>
                        <input 
                          type="number" 
                          value={f.constraints.lt ?? ''} 
                          onChange={e => updateConstraint(f.id, 'lt', e.target.value)}
                          className="w-12 border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                          placeholder="100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Side */}
      <div className="flex flex-col gap-4">
        <div className="box p-5 bg-[#1C1917] text-gray-300 border border-gray-800 rounded-md shadow-inner h-64 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">JSON Schema Preview</h3>
          <pre className="font-mono text-xs leading-relaxed text-indigo-300">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>

        <div className="box p-5 bg-white border border-gray-200 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Test Output (DriftGuard)</h3>
            <button 
              onClick={handleTest}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition flex items-center gap-1.5"
            >
              <Play size={12} className="text-indigo-600" /> Run Test
            </button>
          </div>
          
          <textarea
            value={testPayload}
            onChange={e => setTestPayload(e.target.value)}
            className="w-full flex-1 border border-gray-300 rounded p-3 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none mb-4"
            spellCheck={false}
          />

          {testResult && (
            <div className={`p-3 rounded border text-xs flex items-start gap-2 ${
              testResult.is_valid 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              {testResult.is_valid ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">!</div>}
              <div>
                <p className="font-semibold mb-1">
                  {testResult.is_valid ? 'Valid Output' : 'Schema Violation'}
                </p>
                {testResult.errors.length > 0 && (
                  <ul className="list-disc pl-4 space-y-0.5">
                    {testResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                  </ul>
                )}
                <p className="mt-2 text-opacity-80 opacity-80">Evaluated in {testResult.time_ms}ms</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
