import time
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, Tuple
from app.verdict.similarity import compute_similarity

class CircuitBreakerOpen(Exception):
    pass

class BaseJudge(ABC):
    def __init__(self, provider: str, model: str):
        self.provider = provider
        self.model = model
        self.failures = 0
        self.last_failure_time = 0
        self.max_failures = 5
        self.open_duration_s = 60

    def _is_circuit_open(self) -> bool:
        if self.failures >= self.max_failures:
            if time.time() - self.last_failure_time < self.open_duration_s:
                return True
            else:
                # Half-open state
                self.failures = 0
        return False

    def _record_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()

    def _record_success(self):
        self.failures = 0

    @abstractmethod
    def _call_model(self, prompt: str) -> str:
        """Call the actual LLM provider and return the raw string response."""
        pass

    def evaluate(self, expected: Dict[str, Any], actual: Dict[str, Any], is_high_value: bool = False) -> Dict[str, Any]:
        if self._is_circuit_open():
            return self._fallback_deterministic(expected, actual)

        prompt = self._build_prompt(expected, actual)
        
        try:
            raw_response = self._call_model(prompt)
            result = self._defensive_parse(raw_response)
        except Exception:
            self._record_failure()
            try:
                # One retry
                raw_response = self._call_model(prompt)
                result = self._defensive_parse(raw_response)
            except Exception:
                self._record_failure()
                return self._fallback_deterministic(expected, actual)

        self._record_success()
        result['provider'] = self.provider
        result['model'] = self.model
        result['cache_hit'] = False
        return result

    def _defensive_parse(self, raw_response: str) -> Dict[str, Any]:
        raw_response = raw_response.strip()
        if raw_response.startswith('```json'):
            raw_response = raw_response[7:-3].strip()
        elif raw_response.startswith('```'):
            raw_response = raw_response[3:-3].strip()
            
        return json.loads(raw_response)

    def _build_prompt(self, expected: Dict[str, Any], actual: Dict[str, Any]) -> str:
        return f"""
You are the Parallax Verdict Engine.
Compare the expected schema with the actual output.
Expected:
{json.dumps(expected, indent=2)}

Actual:
{json.dumps(actual, indent=2)}

Output strict JSON with these exact keys:
- factual_accuracy (float 0.0 to 1.0)
- task_completion (float 0.0 to 1.0)
- logical_consistency (float 0.0 to 1.0)
- reasoning (string, one sentence explaining the scores)

Rubric:
0.2 = Completely wrong or missing
0.5 = Partially correct but ambiguous
0.9 = Mostly correct
1.0 = Perfect match
"""

    def _fallback_deterministic(self, expected: Dict[str, Any], actual: Dict[str, Any]) -> Dict[str, Any]:
        # Provider="fallback", entropy from sigma_sim
        sigma_sim = compute_similarity(expected, actual)
        entropy = sigma_sim  # Fallback uses sigma_sim as proxy
        return {
            "factual_accuracy": sigma_sim,
            "task_completion": sigma_sim,
            "logical_consistency": sigma_sim,
            "reasoning": "Judge degraded — deterministic fallback mode",
            "provider": "fallback",
            "model": "deterministic",
            "cache_hit": False,
            "is_fallback": True
        }
