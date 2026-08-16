import pytest
from app.verdict.engine import VerdictEngine

def test_payout_math():
    engine = VerdictEngine()
    
    # max latency penalty
    base_amount = 1.0
    entropy = 1.0
    latency = 22000
    
    # mult = 1 - min(0.25, (22000-2000)/20000) = 1 - 0.25 = 0.75
    payout = engine._calculate_pricing(entropy, latency, base_amount)
    assert payout == 0.75
    
    # no latency penalty
    latency = 1000
    # mult = 1 - min(0.25, 0) = 1.0
    payout = engine._calculate_pricing(entropy, latency, base_amount)
    assert payout == 1.0
    
    # mid penalty
    latency = 12000
    # mult = 1 - min(0.25, 10000/20000) = 1 - 0.25 = 0.75 ? wait, 10000/20000 = 0.5. min(0.25, 0.5) is 0.25
    # Wait, (12000-2000) / 20000 = 0.5. penalty is min(0.25, 0.5) = 0.25. So 0.75
    payout = engine._calculate_pricing(entropy, latency, base_amount)
    assert payout == 0.75
    
    # low penalty
    latency = 4000
    # (4000-2000)/20000 = 0.1. min(0.25, 0.1) = 0.1. mult = 0.9. payout = 0.9.
    payout = engine._calculate_pricing(entropy, latency, base_amount)
    assert payout == 0.9
