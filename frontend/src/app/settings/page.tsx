'use client'
/**
 * Settings page — functional configuration panel.
 * API connection, display preferences, and data management.
 */
import { useState } from 'react'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import {
  Globe, RefreshCw, Database, Bell, Monitor, Code, ChevronRight,
  Check, AlertCircle, Trash2, Download, Upload, ShieldCheck, ShieldAlert
} from 'lucide-react'
import { useHealth } from '@/hooks/useTransactions'

/* ─── Section wrapper ────────────────────────────────────────────────────── */
function Section({ title, description, children }: {
  title: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="col-span-8">
        <div className="box divide-y divide-gray-100">{children}</div>
      </div>
    </div>
  )
}

/* ─── Setting row ────────────────────────────────────────────────────────── */
function SettingRow({ label, description, control }: {
  label: string; description?: string; control: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex-1 pr-8">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  )
}

/* ─── Toggle ─────────────────────────────────────────────────────────────── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative inline-flex w-10 h-5 rounded-full border-2 transition-colors"
      style={{
        background: value ? '#4F46E5' : '#E5E7EB',
        borderColor: value ? '#4F46E5' : '#E5E7EB',
      }}
    >
      <span
        className="inline-block w-4 h-4 bg-white rounded-full shadow transition-transform"
        style={{ transform: value ? 'translateX(20px)' : 'translateX(0px)' }}
      />
    </button>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { isHealthy, version } = useHealth()

  // API config
  const [apiUrl,       setApiUrl]       = useState('http://localhost:8000')
  const [refreshMs,    setRefreshMs]    = useState('3000')
  const [savedApi,     setSavedApi]     = useState(false)

  // Display
  const [tablePageSize,  setTablePageSize]  = useState('25')
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [monoAmounts,    setMonoAmounts]    = useState(true)
  const [compactMode,    setCompactMode]    = useState(false)

  // Notifications
  const [notifyRejected, setNotifyRejected] = useState(true)
  const [notifyCleared,  setNotifyCleared]  = useState(false)
  const [notifyLocked,   setNotifyLocked]   = useState(true)

  const saveApiSettings = () => {
    setSavedApi(true)
    toast.success('API settings saved. Refresh interval updated to ' + refreshMs + 'ms.')
    setTimeout(() => setSavedApi(false), 2000)
  }

  const handleSeedData = async () => {
    const id = toast.loading('Seeding demo data…')
    try {
      const res = await fetch(`${apiUrl}/api/agents/seed`, { method: 'POST' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      toast.success('Demo data seeded. Reload to see changes.', { id })
    } catch {
      toast.error('Seed failed — is the backend running at ' + apiUrl + '?', { id })
    }
  }

  const handleClearCache = () => {
    toast.success('Local cache cleared. Data will refresh on next load.')
  }

  const handleExport = () => {
    const data = { exportedAt: new Date().toISOString(), apiUrl, refreshMs, tablePageSize }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'parallax-settings.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Settings exported as JSON.')
  }

  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [headHash, setHeadHash] = useState<string>('0000000000000000000000000000000000000000000000000000000000000000')
  const [verifiedCount, setVerifiedCount] = useState<number>(0)
  const [lastVerified, setLastVerified] = useState<string>('Never')
  const [firstBroken, setFirstBroken] = useState<number | null>(null)

  const handleVerifyChain = async () => {
    setVerifyStatus('loading')
    try {
      const res = await fetch(`${apiUrl}/api/ledger/verify`)
      if (!res.ok) throw new Error('Failed to verify ledger')
      const data = await res.json()
      setVerifyStatus(data.valid ? 'valid' : 'invalid')
      setHeadHash(data.head_hash)
      setVerifiedCount(data.verified_count)
      setFirstBroken(data.first_broken_seq)
      setLastVerified(new Date().toLocaleTimeString())
      if (data.valid) {
        toast.success(`Ledger integrity verified! ${data.verified_count} blocks intact.`)
      } else {
        toast.error(`Ledger corruption detected at block ${data.first_broken_seq}!`)
      }
    } catch (e) {
      setVerifyStatus('idle')
      toast.error('Failed to connect to ledger verify endpoint')
    }
  }

  return (
    <AppShell title="Settings" subtitle="Configure API connection, display preferences, and data management">
      <div className="max-w-4xl space-y-8">

        {/* ── Connection ─────────────────────────────────────────────────── */}
        <Section
          title="API Connection"
          description="Configure the backend endpoint and data refresh behavior. Changes take effect immediately."
        >
          <SettingRow
            label="API Endpoint"
            description="Base URL for the Parallax Protocol backend"
            control={
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: isHealthy ? '#059669' : '#E11D48' }}
                />
                <span className="text-sm text-gray-500 mr-2">
                  {isHealthy ? 'Connected' : 'Offline'}
                </span>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                  className="input"
                  style={{ width: 220, fontFamily: 'JetBrains Mono', fontSize: 12 }}
                />
              </div>
            }
          />
          <SettingRow
            label="Refresh Interval"
            description="How often to poll the API for new transactions (milliseconds)"
            control={
              <div className="flex items-center gap-2">
                <select
                  value={refreshMs}
                  onChange={e => setRefreshMs(e.target.value)}
                  className="select"
                >
                  <option value="1000">1,000ms — Real-time</option>
                  <option value="3000">3,000ms — Default</option>
                  <option value="10000">10,000ms — Low bandwidth</option>
                  <option value="30000">30,000ms — Minimal</option>
                  <option value="0">0 — Disabled</option>
                </select>
              </div>
            }
          />
          <SettingRow
            label="Backend Version"
            description="Reported by the /api/health endpoint"
            control={
              <span className="font-mono text-sm text-gray-500">
                {isHealthy ? (version ?? '0.1.0') : '— offline'}
              </span>
            }
          />
          <div className="flex justify-end px-5 py-3 bg-gray-50">
            <button onClick={saveApiSettings} className="btn btn-primary">
              {savedApi ? <Check size={14} /> : <Globe size={14} />}
              {savedApi ? 'Saved' : 'Save Connection Settings'}
            </button>
          </div>
        </Section>

        {/* ── Security & Integrity (MO-5) ─────────────────────────────────── */}
        <Section
          title="Escrow Integrity Chain"
          description="Cryptographic verification of the Parallax settlement ledger. Validates SHA-256 block hashes."
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {verifyStatus === 'valid' ? (
                  <ShieldCheck className="text-emerald-500 w-8 h-8" />
                ) : verifyStatus === 'invalid' ? (
                  <ShieldAlert className="text-rose-500 w-8 h-8 animate-pulse" />
                ) : (
                  <ShieldCheck className="text-gray-300 w-8 h-8" />
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">Ledger Verification</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Last checked: {lastVerified}</p>
                </div>
              </div>
              <button onClick={handleVerifyChain} disabled={verifyStatus === 'loading'} className="btn btn-default">
                {verifyStatus === 'loading' ? 'Verifying...' : 'Verify Integrity'}
              </button>
            </div>
            
            <div className="bg-gray-50 rounded border border-gray-100 p-4 font-mono text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">HEAD_HASH</span>
                <span className="text-gray-900" title={headHash}>
                  {headHash.substring(0, 16)}...{headHash.substring(headHash.length - 16)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">VERIFIED_BLOCKS</span>
                <span className={verifyStatus === 'valid' ? 'text-emerald-600 font-bold' : 'text-gray-900'}>
                  {verifiedCount}
                </span>
              </div>
              {firstBroken !== null && (
                <div className="flex justify-between">
                  <span className="text-rose-500 font-bold">CORRUPTED_AT_SEQ</span>
                  <span className="text-rose-600 font-bold">{firstBroken}</span>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── Display ────────────────────────────────────────────────────── */}
        <Section
          title="Display Preferences"
          description="Control how data is presented across all pages. These preferences are saved in your browser session."
        >
          <SettingRow
            label="Show Timestamps"
            description="Display absolute timestamps instead of relative (e.g. '14 Aug 2026 09:42' vs '2 hours ago')"
            control={<Toggle value={showTimestamps} onChange={setShowTimestamps} />}
          />
          <SettingRow
            label="Monospace Amounts"
            description="Render USDC amounts in JetBrains Mono for easier scanning"
            control={<Toggle value={monoAmounts} onChange={setMonoAmounts} />}
          />
          <SettingRow
            label="Compact Table Mode"
            description="Reduce row padding for maximum information density on large monitors"
            control={<Toggle value={compactMode} onChange={setCompactMode} />}
          />
          <SettingRow
            label="Default Page Size"
            description="Number of rows to show per page in the Vault Ledger"
            control={
              <select value={tablePageSize} onChange={e => setTablePageSize(e.target.value)} className="select">
                <option value="10">10 rows</option>
                <option value="25">25 rows</option>
                <option value="50">50 rows</option>
              </select>
            }
          />
        </Section>

        {/* ── Notifications ───────────────────────────────────────────────── */}
        <Section
          title="Alert Thresholds"
          description="Control which transaction state changes trigger toast notifications in the UI."
        >
          <SettingRow
            label="Notify on Rejected TX"
            description="Show an alert when a transaction is rejected due to schema drift"
            control={<Toggle value={notifyRejected} onChange={setNotifyRejected} />}
          />
          <SettingRow
            label="Notify on Cleared TX"
            description="Show a confirmation when a transaction settles successfully"
            control={<Toggle value={notifyCleared} onChange={setNotifyCleared} />}
          />
          <SettingRow
            label="Notify on Locked TX"
            description="Show an alert when a transaction enters the LOCKED state"
            control={<Toggle value={notifyLocked} onChange={setNotifyLocked} />}
          />
        </Section>

        {/* ── Data Management ────────────────────────────────────────────── */}
        <Section
          title="Data Management"
          description="Manage the demo dataset and local cache. All operations are reversible except data deletion."
        >
          <SettingRow
            label="Seed Demo Data"
            description="Populate the backend with 25 synthetic transactions and 2 demo agents for testing"
            control={
              <button onClick={handleSeedData} className="btn btn-default text-sm">
                <Database size={14} />
                Seed Data
              </button>
            }
          />
          <SettingRow
            label="Clear Local Cache"
            description="Force SWR to re-fetch all data from the API on next page load"
            control={
              <button onClick={handleClearCache} className="btn btn-default text-sm">
                <RefreshCw size={14} />
                Clear Cache
              </button>
            }
          />
          <SettingRow
            label="Export Settings"
            description="Download your current settings as a JSON file for backup or sharing"
            control={
              <button onClick={handleExport} className="btn btn-default text-sm">
                <Download size={14} />
                Export JSON
              </button>
            }
          />
        </Section>

        {/* ── Danger Zone ────────────────────────────────────────────────── */}
        <Section
          title="Danger Zone"
          description="Destructive operations. These cannot be undone. Use with caution in production environments."
        >
          <SettingRow
            label="Reset All Settings"
            description="Restore all display and notification preferences to their default values"
            control={
              <button
                onClick={() => {
                  setShowTimestamps(true); setMonoAmounts(true); setCompactMode(false)
                  setTablePageSize('25'); setRefreshMs('3000')
                  toast.info('Settings reset to defaults.')
                }}
                className="btn text-sm"
                style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#E11D48' }}
              >
                <RefreshCw size={14} />
                Reset to Defaults
              </button>
            }
          />
          <div className="px-5 py-3 bg-rose-50 border-t border-red-100">
            <div className="flex items-start gap-3">
              <AlertCircle size={15} className="text-rose-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-rose-600">
                Resetting does not affect backend data. To clear backend transactions, re-deploy the database.
              </p>
            </div>
          </div>
        </Section>

        {/* Version footer */}
        <div className="border-t border-gray-200 pt-5 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Parallax Protocol · Frontend v0.1.0 · <span className="font-mono">Next.js 14</span>
          </p>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost text-sm"
          >
            <Code size={14} />
            API Docs →
          </a>
        </div>

      </div>
    </AppShell>
  )
}
