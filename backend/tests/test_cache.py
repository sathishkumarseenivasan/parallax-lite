import pytest
from app.verdict.cache import verdict_cache

def test_verdict_cache():
    expected = {"a": 1}
    actual = {"a": 1}
    
    # Not in cache
    res = verdict_cache.get(expected, actual, "provider", "model")
    assert res is None
    
    # Store in cache
    verdict_cache.set(expected, actual, "provider", "model", {"factual_accuracy": 1.0})
    
    # Retrieve from cache
    res = verdict_cache.get(expected, actual, "provider", "model")
    assert res is not None
    assert res["cache_hit"] is True
    assert res["factual_accuracy"] == 1.0
