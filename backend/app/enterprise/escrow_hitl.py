from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.enterprise_models import Escrow_Threshold_Rules
from app.models import Transaction

def check_and_apply_escrow_threshold(db: Session, tx: Transaction, org_id: str) -> bool:
    """
    Enterprise Governance: Threshold Halting
    Checks if an escrow lock exceeds the organization's allowed threshold.
    If it does, halts the transaction by setting it to PENDING_HUMAN_APPROVAL.
    
    Returns:
        bool: True if the transaction requires human approval, False otherwise.
    """
    # Fetch the org's threshold rules
    rule = db.query(Escrow_Threshold_Rules).filter(
        Escrow_Threshold_Rules.org_id == org_id
    ).first()
    
    # If no rule exists, default to pass (or could be strict default deny depending on policy)
    if not rule or not rule.requires_approval:
        return False
        
    if tx.amount > rule.threshold_usd:
        # Halt the transaction
        tx.status = "PENDING_HUMAN_APPROVAL"
        db.commit()
        return True
        
    return False

def approve_escrow_transaction(db: Session, tx_id: str, admin_user_id: str) -> Transaction:
    """
    Releases a halted transaction after human approval.
    """
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
        
    if tx.status != "PENDING_HUMAN_APPROVAL":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Transaction is not awaiting approval. Current status: {tx.status}"
        )
        
    # In a full implementation, we'd also log the admin_user_id in an audit trail
    # Proceed to LOCKED or directly to CLEARED based on business logic
    tx.status = "LOCKED" 
    db.commit()
    db.refresh(tx)
    
    return tx
