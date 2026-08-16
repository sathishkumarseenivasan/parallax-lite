import re
import pytest
from pathlib import Path
from app.schemas import (
    AgentResponse,
    TransactionResponse,
    MetricsResponse,
    TaskSubmission
)

def extract_ts_interface(ts_code: str, interface_name: str) -> set[str]:
    pattern = r"export interface " + interface_name + r"\s*\{([^}]*)\}"
    match = re.search(pattern, ts_code)
    if not match:
        raise ValueError(f"Interface {interface_name} not found")
    body = match.group(1)
    fields = set()
    for line in body.split("\n"):
        line = line.strip()
        if not line or line.startswith("//"):
            continue
        field_match = re.match(r"^([a-zA-Z0-9_]+)\??\s*:", line)
        if field_match:
            fields.add(field_match.group(1))
    return fields

def test_contract_unification():
    ts_path = Path(__file__).parent.parent.parent / "frontend" / "src" / "lib" / "types.ts"
    ts_code = ts_path.read_text(encoding="utf-8")

    # Check Agent
    ts_agent_fields = extract_ts_interface(ts_code, "Agent")
    py_agent_fields = set(AgentResponse.model_fields.keys())
    assert ts_agent_fields == py_agent_fields, f"Agent drift: TS={ts_agent_fields}, PY={py_agent_fields}"

    # Check Transaction
    ts_tx_fields = extract_ts_interface(ts_code, "Transaction")
    py_tx_fields = set(TransactionResponse.model_fields.keys())
    assert ts_tx_fields == py_tx_fields, f"Transaction drift: TS={ts_tx_fields}, PY={py_tx_fields}"

    # Check Metrics
    ts_metrics_fields = extract_ts_interface(ts_code, "Metrics")
    py_metrics_fields = set(MetricsResponse.model_fields.keys())
    assert ts_metrics_fields == py_metrics_fields, f"Metrics drift: TS={ts_metrics_fields}, PY={py_metrics_fields}"

    # Check TaskSubmission
    ts_task_fields = extract_ts_interface(ts_code, "TaskSubmission")
    py_task_fields = set(TaskSubmission.model_fields.keys())
    assert ts_task_fields == py_task_fields, f"TaskSubmission drift: TS={ts_task_fields}, PY={py_task_fields}"
    
    # Check ApiError
    ts_apierror_fields = extract_ts_interface(ts_code, "ApiError")
    assert {"code", "message", "docs"}.issubset(ts_apierror_fields), f"ApiError drift: TS={ts_apierror_fields}"
