import pytest
from app.verdict.similarity import compute_similarity, get_leaves

def test_get_leaves():
    data = {"a": {"b": 1}, "c": [2, 3]}
    leaves = get_leaves(data)
    assert leaves == {"a.b": 1, "c[0]": 2, "c[1]": 3}

def test_compute_similarity_perfect():
    expected = {"a": 1, "b": "test"}
    actual = {"a": 1, "b": "test"}
    assert compute_similarity(expected, actual) >= 0.99

def test_compute_similarity_different_values():
    expected = {"a": 1, "b": "test"}
    actual = {"a": 2, "b": "test2"}
    sim = compute_similarity(expected, actual)
    assert sim < 1.0
    assert sim > 0.6  # Keys and types match

def test_compute_similarity_different_keys():
    expected = {"a": 1, "b": "test"}
    actual = {"c": 1, "d": "test"}
    sim = compute_similarity(expected, actual)
    assert sim < 0.6
