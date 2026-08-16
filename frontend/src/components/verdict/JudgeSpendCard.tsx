'use client';
import React, { useEffect, useState } from 'react';

interface UsageData {
  total_calls: number;
  total_cost_usd: number;
  cache_hits: number;
  cache_hit_rate: number;
  avg_cost_per_verdict: number;
  cache_saved_usd: number;
}

export function JudgeSpendCard() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/judge/usage')
      .then(res => res.json())
      .then(data => setUsage(data))
      .catch(err => console.error("Failed to fetch judge usage:", err));
  }, []);

  if (!usage) {
    return (
      <div className="p-4 border rounded-md animate-pulse bg-gray-50 dark:bg-gray-900/50 min-h-[100px]">
        Loading spend...
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-md shadow-sm dark:border-gray-800 flex flex-col gap-2 bg-white dark:bg-[#111]">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Judge Spend (Weekly)</h3>
      <div className="flex justify-between items-end">
        <span className="text-2xl font-bold font-mono">${usage.total_cost_usd.toFixed(4)}</span>
        <span className="text-xs text-green-500 font-mono bg-green-500/10 px-2 py-1 rounded">
          Cache Saved ${usage.cache_saved_usd.toFixed(4)}
        </span>
      </div>
      <div className="flex gap-4 mt-2 pt-2 border-t text-xs text-gray-600 dark:text-gray-400">
        <div>Hits: {usage.cache_hits} ({(usage.cache_hit_rate * 100).toFixed(1)}%)</div>
        <div>Avg Cost: ${usage.avg_cost_per_verdict.toFixed(4)}</div>
      </div>
    </div>
  );
}
