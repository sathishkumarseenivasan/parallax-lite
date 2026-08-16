from typing import Any, Dict, Optional

class PLXError(Exception):
    """Base exception for all Parallax Lite errors."""
    code: str = "PLX-000"
    message: str = "An unknown error occurred."
    docs_url: str = "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-000"

    def __init__(self, message: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        if message:
            self.message = message
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "code": self.code,
            "message": self.message,
            "docs": self.docs_url,
            "details": self.details,
        }

# PLX-1xx Validation Errors
class ValidationError(PLXError):
    code = "PLX-100"
    message = "Schema validation failed."
    docs_url = "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-100"

# PLX-2xx Escrow Errors
class EscrowError(PLXError):
    code = "PLX-200"
    message = "Escrow operation failed."
    docs_url = "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-200"

class InsufficientFundsError(EscrowError):
    code = "PLX-201"
    message = "Insufficient funds for escrow lock."
    docs_url = "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-201"

# PLX-3xx Semantic Errors
class SemanticDriftError(PLXError):
    code = "PLX-300"
    message = "Semantic drift detected in agent output."
    docs_url = "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-300"

# PLX-4xx Settlement Errors
class SettlementError(PLXError):
    code = "PLX-400"
    message = "Transaction settlement failed."
    docs_url = "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-400"

# PLX-5xx Transport Errors
class TransportError(PLXError):
    code = "PLX-500"
    message = "Transport or event bus error."
    docs_url = "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-500"
