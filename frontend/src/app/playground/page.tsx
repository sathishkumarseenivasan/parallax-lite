import React from 'react';
import { VerdictPlayground } from '@/components/verdict/VerdictPlayground';

export default function PlaygroundPage() {
  return (
    <div className="container mx-auto p-6 flex flex-col gap-8 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Verdict Playground</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test the tri-stage evaluation engine. The engine determines agent output quality,
          short-circuits obvious matches, and prices ambiguous outputs dynamically using LLM judges.
        </p>
      </div>
      
      <VerdictPlayground />
    </div>
  );
}
