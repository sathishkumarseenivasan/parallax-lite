import base64
import json
import hashlib
from typing import Dict, Any
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature

class AgentIdentity:
    """
    Implements Decentralized Identifiers (DIDs) for AI Agents using Ed25519 cryptography.
    Allows agents to act as autonomous cryptographic entities.
    """
    
    def __init__(self, org_id: str, escrow_limit: float):
        self.org_id = org_id
        self.escrow_limit = escrow_limit
        # Generate an Ed25519 key pair for the agent
        self.private_key = ed25519.Ed25519PrivateKey.generate()
        self.public_key = self.private_key.public_key()
        
        # The public key bytes
        self.public_bytes = self.public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        # DID is derived from the SHA-256 hash of the public key
        pk_hash = hashlib.sha256(self.public_bytes).hexdigest()[:32]
        self.did = f"did:parallax:{pk_hash}"

    def get_did_document(self) -> Dict[str, Any]:
        """
        Generates a simplified, pragmatic Parallax-specific DID Document.
        Contains the public key, the owning enterprise organization, and allowed escrow limits.
        """
        b64_pub_key = base64.b64encode(self.public_bytes).decode('utf-8')
        
        return {
            "@context": "https://parallax.network/did/v1",
            "id": self.did,
            "verificationMethod": [{
                "id": f"{self.did}#keys-1",
                "type": "Ed25519VerificationKey2020",
                "controller": self.did,
                "publicKeyBase64": b64_pub_key
            }],
            "service": [{
                "id": f"{self.did}#parallax-node",
                "type": "ParallaxProxy",
                "serviceEndpoint": f"https://proxy.{self.org_id.lower()}.enterprise.com"
            }],
            "metadata": {
                "org_id": self.org_id,
                "escrow_limit": self.escrow_limit,
                "status": "ACTIVE"
            }
        }

    def sign_payload(self, payload: Dict[str, Any]) -> str:
        """
        Cryptographically signs a payload (dict) using the agent's private key.
        Returns a base64 encoded signature.
        """
        # Ensure deterministic JSON serialization
        payload_bytes = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
        signature = self.private_key.sign(payload_bytes)
        return base64.b64encode(signature).decode('utf-8')

    @staticmethod
    def verify_signature(public_key_b64: str, signature_b64: str, payload: Dict[str, Any]) -> bool:
        """
        Verifies an incoming payload's signature using the sender's public key.
        Prevents Man-in-the-Middle (MitM) attacks.
        """
        try:
            public_bytes = base64.b64decode(public_key_b64)
            signature = base64.b64decode(signature_b64)
            payload_bytes = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
            
            loaded_public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_bytes)
            loaded_public_key.verify(signature, payload_bytes)
            return True
        except InvalidSignature:
            return False
        except Exception:
            return False
