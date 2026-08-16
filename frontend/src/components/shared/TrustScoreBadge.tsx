import React from 'react'
import { ShieldCheck } from 'lucide-react'

export function TrustScoreBadge({ score, verified = false }: { score?: number | null, verified?: boolean }) {
  if (score === undefined || score === null) {
    return (
      <span 
        className="inline-flex items-center gap-1 font-mono text-xs font-medium px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-400"
        title="Trust Score Pending"
      >
        TBD
      </span>
    )
  }

  const scoreColor = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#E11D48'
  const trend = score >= 80 ? '↑' : score >= 60 ? '→' : '↓'
  const bgColor = score >= 80 ? '#ECFDF5' : score >= 60 ? '#FFFBEB' : '#FFF1F2'

  return (
    <span 
      className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded border"
      style={{ color: scoreColor, backgroundColor: bgColor, borderColor: scoreColor + '40' }}
      title="Parallax Trust Score™"
    >
      <span>{score.toFixed(0)}</span>
      <span>{trend}</span>
      {verified && <span title="Verified by the Court (≥10 semantic verdicts)"><ShieldCheck size={12} className="ml-0.5 opacity-80" /></span>}
    </span>
  )
}
