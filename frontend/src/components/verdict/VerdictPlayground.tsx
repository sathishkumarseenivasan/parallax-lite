'use client';
import React, { useState } from 'react';
import { VerdictPipeline } from './VerdictPipeline';

interface VerdictResponse {
  is_fallback?: boolean;
  model?: string;
  sigma_sim?: number;
  factual_accuracy?: number;
  task_completion?: number;
  logical_consistency?: number;
  reasoning?: string;
  payout?: number;
  cache_hit?: boolean;
}

export function VerdictPlayground() {
  const [expectedSchema, setExpectedSchema] = useState('{\n  "status": "string",\n  "count": "integer"\n}');
  const [actualOutput, setActualOutput] = useState('{\n  "status": "ok",\n  "count": 42\n}');
  const [verdict, setVerdict] = useState<VerdictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runEvaluation = async () => {
    setLoading(true);
    setError(null);
    setVerdict(null);
    try {
      let parsedSchema;
      try {
        parsedSchema = JSON.parse(expectedSchema);
      } catch (e) {
        throw new Error("Expected Schema must be valid JSON.");
      }

      const res = await fetch('http://localhost:8000/api/playground/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected_schema: parsedSchema,
          actual_output: actualOutput
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setVerdict(data.verdict);
      } else {
        setError(data.error);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm">Expected Schema (JSON)</label>
          <textarea
            className="w-full h-48 p-3 font-mono text-sm border rounded bg-gray-50 dark:bg-[#111] dark:border-gray-800"
            value={expectedSchema}
            onChange={(e) => setExpectedSchema(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm">Actual Agent Output</label>
          <textarea
            className="w-full h-48 p-3 font-mono text-sm border rounded bg-gray-50 dark:bg-[#111] dark:border-gray-800"
            value={actualOutput}
            onChange={(e) => setActualOutput(e.target.value)}
          />
        </div>
      </div>
      
      <button 
        onClick={runEvaluation}
        disabled={loading}
        className="self-start px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? "Evaluating..." : "Run Verdict Engine"}
      </button>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded dark:bg-red-900/30 dark:text-red-400">
          <strong>Evaluation Failed:</strong> {error}
        </div>
      )}

      {verdict && (
        <div className="mt-4">
          <VerdictPipeline
            stage={verdict.is_fallback || verdict.model === 'sigma_sim' ? 2 : 3}
            sigmaSim={verdict.sigma_sim ?? 0}
            factualAccuracy={verdict.factual_accuracy}
            taskCompletion={verdict.task_completion}
            logicalConsistency={verdict.logical_consistency}
            reasoning={verdict.reasoning}
            cost={verdict.payout ?? 0}
            cacheHit={verdict.cache_hit ?? false}
          />
        </div>
      )}
    </div>
  );
}
