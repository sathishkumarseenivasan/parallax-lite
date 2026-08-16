import React from 'react';

interface VerdictPipelineProps {
  stage: number;
  sigmaSim: number;
  factualAccuracy?: number;
  taskCompletion?: number;
  logicalConsistency?: number;
  reasoning?: string;
  cost?: number;
  cacheHit?: boolean;
}

export function VerdictPipeline({
  stage,
  sigmaSim,
  factualAccuracy,
  taskCompletion,
  logicalConsistency,
  reasoning,
  cost,
  cacheHit
}: VerdictPipelineProps) {
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md shadow-sm dark:border-gray-800">
      <h3 className="text-lg font-bold">Verdict Pipeline</h3>
      
      {/* Stage 1 */}
      <div className="flex items-center justify-between border-b pb-2">
        <span className="font-semibold text-gray-700 dark:text-gray-300">Stage 1: Deterministic</span>
        <span className="text-green-500 font-mono text-sm">✓ (0.3ms)</span>
      </div>

      {/* Stage 2 */}
      <div className="flex items-center justify-between border-b pb-2">
        <span className="font-semibold text-gray-700 dark:text-gray-300">Stage 2: Structural</span>
        <span className="font-mono text-sm">σ_sim: {(sigmaSim * 100).toFixed(1)}%</span>
      </div>

      {/* Stage 3 */}
      {stage >= 2 && (
        <div className="flex flex-col gap-2 pt-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Stage 3: LLM Judge</span>
          <div className="flex flex-col gap-1 text-sm pl-4 border-l-2 border-blue-500">
            <div className="flex justify-between">
              <span>Factual Accuracy</span>
              <span className="font-mono">{(factualAccuracy ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Task Completion</span>
              <span className="font-mono">{(taskCompletion ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Logical Consistency</span>
              <span className="font-mono">{(logicalConsistency ?? 0).toFixed(2)}</span>
            </div>
          </div>
          {reasoning && (
            <p className="text-sm italic text-gray-600 dark:text-gray-400 mt-2 border-l-2 border-gray-300 pl-2">
              "{reasoning}"
            </p>
          )}
        </div>
      )}

      {/* Meta Footer */}
      <div className="flex justify-between items-center mt-4 pt-2 border-t">
        {cacheHit ? (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full dark:bg-green-900/30 dark:text-green-400">
            Cache Hit ($0.00)
          </span>
        ) : (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full dark:bg-gray-800 dark:text-gray-300">
            Cost: ${(cost ?? 0).toFixed(5)}
          </span>
        )}
      </div>
    </div>
  );
}
