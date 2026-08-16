import os
import time
from typing import Any, Dict, List, Optional
from statistics import median

from app.errors import SemanticDriftError, ValidationError
from app.verdict.dialect import normalize_to_json
from app.verdict.similarity import compute_similarity
from app.verdict.cache import verdict_cache
from app.judges.base import BaseJudge
from app.judges.api_judge import APIJudge
from app.judges.ollama_judge import OllamaJudge
from app.driftguard.dsl import DriftGuard

HIGH_VALUE_THRESHOLD = 0.50

def get_judge() -> BaseJudge:
    provider = os.getenv("JUDGE_PROVIDER", "api")
    if provider == "ollama":
        return OllamaJudge()
    return APIJudge()

class VerdictEngine:
    def __init__(self):
        self.judge = get_judge()
        
    def _calculate_pricing(self, entropy_score: float, latency_ms: float, base_amount: float) -> float:
        latency_multiplier = 1.0 - min(0.25, max(0.0, (latency_ms - 2000.0) / 20000.0))
        payout = base_amount * entropy_score * latency_multiplier
        return round(payout, 6)

    def get_calibrated_weights(self, task_type: str) -> dict:
        # Stub for self-tuning weights
        return {"factual": 0.5, "task": 0.3, "logical": 0.2}

    def get_sim_thresholds(self, task_type: str) -> tuple[float, float]:
        # Stub for self-tuning thresholds (min_pass, min_ambiguous)
        return (0.92, 0.60)

    def evaluate(self, expected: Dict[str, Any], raw_actual: str, amount: float, drift_guard: Optional[DriftGuard] = None, task_type: str = "default") -> Dict[str, Any]:
        start_time = time.time()
        
        # STAGE 0: Dialect Normalization
        try:
            actual = normalize_to_json(raw_actual)
        except ValidationError as e:
            raise SemanticDriftError(f"Stage 0 Rejected: {e.message}")

        # STAGE 1: DriftGuard Deterministic
        if drift_guard:
            errors = drift_guard.validate(actual)
            if errors:
                raise SemanticDriftError(f"Stage 1 Rejected: {'; '.join(errors)}")
        
        # STAGE 2: Structural Similarity
        sigma_sim = compute_similarity(expected, actual)
        
        # SELF-TUNING THRESHOLDS
        fast_pass_thresh, reject_thresh = self.get_sim_thresholds(task_type)
        is_high_value = amount >= HIGH_VALUE_THRESHOLD

        # CALIBRATED WEIGHTS
        weights = self.get_calibrated_weights(task_type)

        provider = self.judge.provider
        model = self.judge.model
        
        # Check Cache
        cached_verdict = verdict_cache.get(expected, actual, provider, model)
        if cached_verdict:
            entropy_score = weights["factual"] * cached_verdict.get("factual_accuracy", 0) + \
                            weights["task"] * cached_verdict.get("task_completion", 0) + \
                            weights["logical"] * cached_verdict.get("logical_consistency", 0)
            latency_ms = (time.time() - start_time) * 1000
            payout = self._calculate_pricing(entropy_score, latency_ms, amount)
            cached_verdict["payout"] = payout
            cached_verdict["latency_ms"] = latency_ms
            cached_verdict["sigma_sim"] = sigma_sim
            return cached_verdict

        if sigma_sim < reject_thresh and not is_high_value:
            # REJECT
            raise SemanticDriftError(f"Stage 2 Rejected: Structural similarity {sigma_sim} < {reject_thresh}")
        
        if sigma_sim >= fast_pass_thresh and not is_high_value:
            # CLEARED without judge
            entropy_score = sigma_sim
            latency_ms = (time.time() - start_time) * 1000
            payout = self._calculate_pricing(entropy_score, latency_ms, amount)
            verdict = {
                "factual_accuracy": sigma_sim,
                "task_completion": sigma_sim,
                "logical_consistency": sigma_sim,
                "reasoning": "Stage 2 Fast Pass (High Similarity)",
                "provider": "deterministic",
                "model": "sigma_sim",
                "cache_hit": False,
                "sigma_sim": sigma_sim,
                "entropy_score": entropy_score,
                "payout": payout,
                "latency_ms": latency_ms,
                "is_fallback": False
            }
            verdict_cache.set(expected, actual, "deterministic", "sigma_sim", verdict)
            return verdict
            
        # STAGE 3: LLM Judge (Escalation) - JUDGE ROUTER
        use_appellate = is_high_value
        
        if use_appellate:
            original_model = self.judge.model
            self.judge.model = os.getenv("JUDGE_APPELLATE_MODEL", "gpt-4-turbo")
            # Self-consistency with 3 calls
            results = []
            for _ in range(3):
                res = self.judge.evaluate(expected, actual, is_high_value=True)
                results.append(res)
            self.judge.model = original_model
            
            factual_scores = [r.get("factual_accuracy", 0.0) for r in results]
            task_scores = [r.get("task_completion", 0.0) for r in results]
            logical_scores = [r.get("logical_consistency", 0.0) for r in results]
            
            med_factual = median(factual_scores)
            med_task = median(task_scores)
            med_logical = median(logical_scores)
            
            spread_factual = max(factual_scores) - min(factual_scores)
            spread_task = max(task_scores) - min(task_scores)
            spread_logical = max(logical_scores) - min(logical_scores)
            max_spread = max(spread_factual, spread_task, spread_logical)
            
            final_res = results[0].copy()
            final_res["factual_accuracy"] = med_factual
            final_res["task_completion"] = med_task
            final_res["logical_consistency"] = med_logical
            final_res["low_confidence"] = max_spread > 0.25
            if max_spread > 0.25:
                final_res["reasoning"] += f" (Warning: High evaluator disagreement, spread={max_spread:.2f})"
            final_res["model"] = os.getenv("JUDGE_APPELLATE_MODEL", "gpt-4-turbo")
        else:
            final_res = self.judge.evaluate(expected, actual)

        entropy_score = weights["factual"] * final_res.get("factual_accuracy", 0.0) + \
                        weights["task"] * final_res.get("task_completion", 0.0) + \
                        weights["logical"] * final_res.get("logical_consistency", 0.0)
                        
        latency_ms = (time.time() - start_time) * 1000
        payout = self._calculate_pricing(entropy_score, latency_ms, amount)
        
        final_res["sigma_sim"] = sigma_sim
        final_res["entropy_score"] = entropy_score
        final_res["payout"] = payout
        final_res["latency_ms"] = latency_ms

        if final_res.get("provider") != "fallback":
            verdict_cache.set(expected, actual, provider, model, final_res)
            
        return final_res

engine = VerdictEngine()
