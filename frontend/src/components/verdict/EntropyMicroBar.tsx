import React from 'react';

interface EntropyMicroBarProps {
  score: number; // 0.0 to 1.0
}

export function EntropyMicroBar({ score }: EntropyMicroBarProps) {
  let colorClass = 'bg-rose-500';
  if (score >= 0.9) {
    colorClass = 'bg-emerald-500';
  } else if (score >= 0.6) {
    colorClass = 'bg-amber-500';
  }

  const width = Math.max(0, Math.min(100, score * 100));

  return (
    <div
      className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-800"
      title={`Entropy Score: ${score.toFixed(2)}`}
    >
      <div
        className={`h-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
