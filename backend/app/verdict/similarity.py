import difflib
import json
from typing import Any, Dict

def get_leaves(data: Any, prefix: str = "") -> Dict[str, Any]:
    leaves = {}
    if isinstance(data, dict):
        for k, v in data.items():
            leaves.update(get_leaves(v, f"{prefix}.{k}" if prefix else k))
    elif isinstance(data, list):
        for i, v in enumerate(data):
            leaves.update(get_leaves(v, f"{prefix}[{i}]"))
    else:
        leaves[prefix] = data
    return leaves

def compute_similarity(expected: Dict[str, Any], actual: Dict[str, Any]) -> float:
    """
    STAGE 2: Structural Similarity σ_sim
    Weights:
    - Key-set overlap: 40%
    - Value-type agreement: 30%
    - Sequence ratio on serialized leaves: 30%
    """
    if not expected and not actual:
        return 1.0

    exp_leaves = get_leaves(expected)
    act_leaves = get_leaves(actual)

    exp_keys = set(exp_leaves.keys())
    act_keys = set(act_leaves.keys())

    # 1. Key-set overlap (Jaccard similarity)
    intersection = exp_keys.intersection(act_keys)
    union = exp_keys.union(act_keys)
    key_overlap = len(intersection) / len(union) if union else 1.0

    # 2. Value-type agreement on overlapping keys
    type_matches = 0
    for k in intersection:
        if type(exp_leaves[k]) == type(act_leaves[k]):
            type_matches += 1
    type_agreement = type_matches / len(intersection) if intersection else 1.0

    # 3. Sequence ratio on serialized leaves (difflib)
    exp_str = json.dumps(expected, sort_keys=True)
    act_str = json.dumps(actual, sort_keys=True)
    seq_ratio = difflib.SequenceMatcher(None, exp_str, act_str).ratio()

    # Weighted sum
    sigma_sim = (0.4 * key_overlap) + (0.3 * type_agreement) + (0.3 * seq_ratio)
    
    return min(1.0, max(0.0, sigma_sim))
