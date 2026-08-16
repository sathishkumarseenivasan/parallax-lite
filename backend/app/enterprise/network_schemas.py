from pydantic import BaseModel, Field
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime

class HandshakeState(str, Enum):
    PENDING_HANDSHAKE = "PENDING_HANDSHAKE"
    SHADOW_LOCKED = "SHADOW_LOCKED"
    EXECUTING = "EXECUTING"
    SETTLED = "SETTLED"
    REJECTED = "REJECTED"

class AgentPayload(BaseModel):
    transaction_id: str
    sender_did: str
    receiver_did: str
    amount: float
    task_intent: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class HandshakeRequest(BaseModel):
    payload: AgentPayload
    signature_b64: str
    sender_public_key_b64: str

class HandshakeResponse(BaseModel):
    status: HandshakeState
    transaction_id: str
    message: str
    receiver_signature_b64: Optional[str] = None

class DirectoryEntry(BaseModel):
    did: str
    org_id: str
    service_name: str
    description: str
    expected_schema: Dict[str, Any]
    price_per_call: float
    public_key_b64: str
    endpoint_url: str  # Parallax proxy URL, not internal URL
