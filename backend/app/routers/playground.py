from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict
from app.verdict.engine import engine
from app.errors import SemanticDriftError

router = APIRouter(prefix="/api/playground", tags=["playground"])

class PlaygroundRequest(BaseModel):
    expected_schema: Dict[str, Any]
    actual_output: str

@router.post("/evaluate")
def evaluate_playground(payload: PlaygroundRequest):
    try:
        verdict = engine.evaluate(
            expected=payload.expected_schema,
            raw_actual=payload.actual_output,
            amount=1.0 # default high value for playground to trigger full flow
        )
        return {"status": "success", "verdict": verdict}
    except SemanticDriftError as e:
        return {"status": "rejected", "error": str(e)}
