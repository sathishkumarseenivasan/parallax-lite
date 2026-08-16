import pytest
from app.judges.base import BaseJudge
from typing import Dict, Any

class MockJudge(BaseJudge):
    def __init__(self):
        super().__init__("mock", "mock-model")
    
    def _call_model(self, prompt: str) -> str:
        raise Exception("Mock failure")

def test_circuit_breaker():
    judge = MockJudge()
    expected = {"a": 1}
    actual = {"a": 1}
    
    # 5 failures open the circuit (Wait, evaluate calls retry on first failure so 1 evaluate = 2 failures)
    for _ in range(3):
        res = judge.evaluate(expected, actual)
        
    assert judge._is_circuit_open() is True
    
    # After circuit is open, we get deterministic fallback
    res = judge.evaluate(expected, actual)
    assert res["is_fallback"] is True
    assert res["reasoning"] == "Judge degraded — deterministic fallback mode"
    assert res["provider"] == "fallback"
