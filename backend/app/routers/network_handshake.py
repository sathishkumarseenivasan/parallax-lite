from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.enterprise.network_schemas import HandshakeRequest, HandshakeResponse, HandshakeState
from app.enterprise.agent_identity import AgentIdentity
from typing import Dict

router = APIRouter(
    prefix="/api/v1/network",
    tags=["Cross-Enterprise Network"]
)

# Mocked state for shadow locks (in a real scenario, this would be in Postgres or Redis)
_SHADOW_LOCK_DB: Dict[str, HandshakeState] = {}

# Mock registry lookup to check if an org is in good standing
def _is_org_verified(did: str) -> bool:
    # In production, this queries the Parallax Smart Contract or trusted central registry
    return True

@router.post("/handshake", response_model=HandshakeResponse)
async def atomic_handshake(request: HandshakeRequest, db: Session = Depends(get_db)):
    """
    The Atomic Handshake Protocol.
    Bank A's Node sends a DID-signed request to Equifax's Node to lock funds.
    """
    
    # 1. Prevent MitM: Verify the cryptographic signature using the sender's public DID key
    payload_dict = request.payload.model_dump(mode="json")
    
    is_valid = AgentIdentity.verify_signature(
        public_key_b64=request.sender_public_key_b64,
        signature_b64=request.signature_b64,
        payload=payload_dict
    )
    
    if not is_valid:
        # Fails securely on invalid signature
        raise HTTPException(status_code=401, detail="Cryptographic signature verification failed. Possible MitM attack.")

    # 2. Check Parallax Directory standing
    if not _is_org_verified(request.payload.sender_did):
        raise HTTPException(status_code=403, detail="Sender organization is not verified in the Parallax Registry.")

    # 3. Create a 'Shadow Escrow' lock
    tx_id = request.payload.transaction_id
    
    if tx_id in _SHADOW_LOCK_DB:
        raise HTTPException(status_code=409, detail="Transaction ID already exists in Shadow Lock state.")

    # In production, we'd persist this state to Postgres to survive pod restarts.
    # We'd also countersign the response.
    _SHADOW_LOCK_DB[tx_id] = HandshakeState.SHADOW_LOCKED

    # 4. Return success to authorize Bank A to lock the actual funds on their side
    return HandshakeResponse(
        status=HandshakeState.SHADOW_LOCKED,
        transaction_id=tx_id,
        message="Shadow lock successful. Sender is authorized to lock primary funds.",
        # receiver_signature_b64="<base64_countersignature_here>"
    )
