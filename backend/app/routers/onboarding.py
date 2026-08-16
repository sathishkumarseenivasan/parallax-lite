from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.models import SystemMeta
from pydantic import BaseModel
import json

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

class OnboardingEvent(BaseModel):
    event_name: str

def _get_onboarding_state(db: Session) -> dict:
    meta = db.get(SystemMeta, "onboarding_state")
    if meta:
        return json.loads(meta.value)
    
    # Default state
    state = {
        "booted": False,
        "agent_created": False,
        "session_funded": False,
        "schema_defined": False,
        "task_submitted": False,
        "verdict_viewed": False,
        "badge_copied": False
    }
    new_meta = SystemMeta(key="onboarding_state", value=json.dumps(state))
    db.add(new_meta)
    db.commit()
    return state

@router.get("/state")
def get_onboarding_state(db: Session = Depends(get_db)):
    state = _get_onboarding_state(db)
    # Auto-complete booted if not already true
    if not state["booted"]:
        state["booted"] = True
        meta = db.get(SystemMeta, "onboarding_state")
        meta.value = json.dumps(state)
        db.commit()
        
    return state

@router.post("/event")
def emit_onboarding_event(event: OnboardingEvent, db: Session = Depends(get_db)):
    state = _get_onboarding_state(db)
    valid_events = state.keys()
    
    if event.event_name in valid_events:
        state[event.event_name] = True
        meta = db.get(SystemMeta, "onboarding_state")
        meta.value = json.dumps(state)
        db.commit()
        
        # Optionally emit via websocket
        from app.bus import bus
        bus.publish("onboarding_updated", state)
        
    return state
