"""
Deterministic validation engine — the heart of Parallax Lite.
Catches malformed outputs for $0.00 compute cost.
"""
import json
import time
from dataclasses import dataclass, field
from typing import Any, Optional, Type

from pydantic import BaseModel, ValidationError, field_validator


# ---------------------------------------------------------------------------
# Concrete task schemas
# ---------------------------------------------------------------------------

class PriceCheckSchema(BaseModel):
    """Expected output when a seller performs a price-check task."""
    item_name: str
    price: float = field(default=...)
    currency: str = "USD"
    in_stock: bool
    source_url: str

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError(f"price must be > 0, got {v}")
        return v


class DataExtractionSchema(BaseModel):
    """Expected output when a seller performs a data-extraction task."""
    records: list[dict[str, Any]]
    record_count: int
    extraction_confidence: float
    source: str

    @field_validator("extraction_confidence")
    @classmethod
    def confidence_range(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError(f"extraction_confidence must be in [0.0, 1.0], got {v}")
        return v


class CodeGenerationSchema(BaseModel):
    """Expected output when a seller performs a code-generation task."""
    language: str
    code: str
    passes_tests: bool
    line_count: int

    @field_validator("line_count")
    @classmethod
    def line_count_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError(f"line_count must be > 0, got {v}")
        return v


# ---------------------------------------------------------------------------
# Schema registry
# ---------------------------------------------------------------------------

SCHEMA_REGISTRY: dict[str, Type[BaseModel]] = {
    "PriceCheck": PriceCheckSchema,
    "DataExtraction": DataExtractionSchema,
    "CodeGeneration": CodeGenerationSchema,
}


# ---------------------------------------------------------------------------
# Validation result
# ---------------------------------------------------------------------------

@dataclass
class ValidationResult:
    """Immutable result of a single validation run."""
    is_valid: bool
    parsed_data: Optional[dict[str, Any]]
    errors: list[str]
    time_ms: float
    schema_name: str


# ---------------------------------------------------------------------------
# Validator
# ---------------------------------------------------------------------------

class ParallaxValidator:
    """
    Deterministic, schema-driven validation engine.

    Pipeline:
      1. Look up schema class in SCHEMA_REGISTRY.
      2. Parse raw_output as JSON.
      3. Validate parsed JSON against Pydantic schema.
      4. Return ValidationResult with timing.

    All exceptions are caught and translated into structured error messages
    so the calling code never needs to worry about exception handling.
    """

    def validate(self, schema_name: str, raw_output: str) -> ValidationResult:
        """
        Validate raw seller output against the named schema.

        Args:
            schema_name: Key into SCHEMA_REGISTRY (e.g. "PriceCheck").
            raw_output:  Raw string from the seller agent (should be JSON).

        Returns:
            ValidationResult with is_valid, parsed_data, errors, and timing.
        """
        start = time.perf_counter()
        errors: list[str] = []
        parsed_data: Optional[dict[str, Any]] = None

        try:
            # Step 1: Look up schema
            schema_cls = self._get_schema(schema_name)

            # Step 2: Parse JSON
            raw_dict = self._parse_json(raw_output)
            parsed_data = raw_dict

            # Step 3: Validate against Pydantic model
            validated = schema_cls.model_validate(raw_dict)
            parsed_data = validated.model_dump()

        except KeyError:
            errors.append(
                f"Unknown schema '{schema_name}'. "
                f"Valid options: {list(SCHEMA_REGISTRY.keys())}"
            )
        except json.JSONDecodeError as exc:
            errors.append(f"JSON parse error: {exc.msg} at position {exc.pos}")
        except ValidationError as exc:
            for err in exc.errors():
                loc = " → ".join(str(p) for p in err["loc"]) if err["loc"] else "root"
                errors.append(f"Schema violation [{loc}]: {err['msg']}")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"Unexpected validation error: {exc}")

        elapsed_ms = (time.perf_counter() - start) * 1000

        return ValidationResult(
            is_valid=len(errors) == 0,
            parsed_data=parsed_data,
            errors=errors,
            time_ms=round(elapsed_ms, 3),
            schema_name=schema_name,
        )

    def _get_schema(self, schema_name: str) -> Type[BaseModel]:
        """Look up and return the Pydantic schema class."""
        if schema_name not in SCHEMA_REGISTRY:
            raise KeyError(schema_name)
        return SCHEMA_REGISTRY[schema_name]

    def _parse_json(self, raw: str) -> dict[str, Any]:
        """Parse a raw string as JSON, raising json.JSONDecodeError on failure."""
        return json.loads(raw)


# Module-level singleton
validator = ParallaxValidator()
