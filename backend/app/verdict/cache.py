import hashlib
import json
from typing import Any, Dict, Optional

class VerdictCache:
    def __init__(self):
        # In-memory cache for simplicity in Lite, can be swapped for Redis
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _generate_key(self, expected: Dict[str, Any], actual: Dict[str, Any], provider: str, model: str) -> str:
        exp_str = json.dumps(expected, sort_keys=True)
        act_str = json.dumps(actual, sort_keys=True)
        raw_key = f"{exp_str}|{act_str}|{provider}|{model}"
        return hashlib.sha256(raw_key.encode('utf-8')).hexdigest()

    def get(self, expected: Dict[str, Any], actual: Dict[str, Any], provider: str, model: str) -> Optional[Dict[str, Any]]:
        key = self._generate_key(expected, actual, provider, model)
        return self._cache.get(key)

    def set(self, expected: Dict[str, Any], actual: Dict[str, Any], provider: str, model: str, verdict: Dict[str, Any]):
        key = self._generate_key(expected, actual, provider, model)
        # Store with cache_hit flag pre-set for retrieval
        verdict_copy = dict(verdict)
        verdict_copy['cache_hit'] = True
        self._cache[key] = verdict_copy

verdict_cache = VerdictCache()
