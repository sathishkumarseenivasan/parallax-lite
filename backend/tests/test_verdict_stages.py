import pytest
from app.verdict.engine import VerdictEngine
from app.errors import SemanticDriftError

def test_stage0_invalid_dialect():
    engine = VerdictEngine()
    with pytest.raises(SemanticDriftError) as excinfo:
        engine.evaluate({"expected": "schema"}, "not json", 0.1)
    assert "Stage 0 Rejected" in str(excinfo.value)

def test_stage2_fast_pass():
    engine = VerdictEngine()
    expected = {"k1": "v1"}
    actual = '{"k1": "v1"}'
    # Test low value -> fast pass
    res = engine.evaluate(expected, actual, 0.1)
    assert res["is_fallback"] is False
    assert res["model"] == "sigma_sim"
    assert res["sigma_sim"] >= 0.99
    
def test_stage2_reject():
    engine = VerdictEngine()
    expected = {"k1": "v1", "k2": "v2", "k3": "v3"}
    actual = '{"a": 1, "b": 2, "c": 3}'
    with pytest.raises(SemanticDriftError) as excinfo:
        engine.evaluate(expected, actual, 0.1)
    assert "Stage 2 Rejected" in str(excinfo.value)

