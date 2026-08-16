"""
Tests for the ParallaxValidator assertion engine.
Covers all three schemas, valid/invalid inputs, timing, and edge cases.
"""
import json

import pytest

from app.assertions import (
    CodeGenerationSchema,
    DataExtractionSchema,
    ParallaxValidator,
    PriceCheckSchema,
    SCHEMA_REGISTRY,
    ValidationResult,
    validator,
)


@pytest.fixture()
def v() -> ParallaxValidator:
    return ParallaxValidator()


# ---------------------------------------------------------------------------
# PriceCheck
# ---------------------------------------------------------------------------

class TestPriceCheckSchema:
    def test_valid_price_check(self, v: ParallaxValidator) -> None:
        output = json.dumps({
            "item_name": "Laptop",
            "price": 1299.99,
            "currency": "USD",
            "in_stock": True,
            "source_url": "https://store.example.com",
        })
        result = v.validate("PriceCheck", output)
        assert result.is_valid is True
        assert result.errors == []
        assert result.time_ms >= 0.0

    def test_negative_price_rejected(self, v: ParallaxValidator) -> None:
        output = json.dumps({
            "item_name": "Widget",
            "price": -5.0,
            "currency": "USD",
            "in_stock": False,
            "source_url": "https://a.com",
        })
        result = v.validate("PriceCheck", output)
        assert result.is_valid is False
        assert any("price" in e.lower() for e in result.errors)

    def test_missing_required_field(self, v: ParallaxValidator) -> None:
        output = json.dumps({
            "item_name": "Widget",
            # price missing
            "in_stock": True,
            "source_url": "https://a.com",
        })
        result = v.validate("PriceCheck", output)
        assert result.is_valid is False

    def test_wrong_type_for_price(self, v: ParallaxValidator) -> None:
        output = json.dumps({
            "item_name": "Widget",
            "price": "expensive",  # should be float
            "in_stock": True,
            "source_url": "https://a.com",
        })
        result = v.validate("PriceCheck", output)
        assert result.is_valid is False


# ---------------------------------------------------------------------------
# DataExtraction
# ---------------------------------------------------------------------------

class TestDataExtractionSchema:
    def test_valid_extraction(self, v: ParallaxValidator) -> None:
        output = json.dumps({
            "records": [{"id": 1, "name": "Alice"}],
            "record_count": 1,
            "extraction_confidence": 0.95,
            "source": "https://api.example.com",
        })
        result = v.validate("DataExtraction", output)
        assert result.is_valid is True

    def test_confidence_out_of_range(self, v: ParallaxValidator) -> None:
        output = json.dumps({
            "records": [],
            "record_count": 0,
            "extraction_confidence": 1.5,
            "source": "db",
        })
        result = v.validate("DataExtraction", output)
        assert result.is_valid is False

    def test_records_not_a_list(self, v: ParallaxValidator) -> None:
        output = json.dumps({
            "records": {"broken": True},
            "record_count": 0,
            "extraction_confidence": 0.8,
            "source": "db",
        })
        result = v.validate("DataExtraction", output)
        assert result.is_valid is False


# ---------------------------------------------------------------------------
# CodeGeneration
# ---------------------------------------------------------------------------

class TestCodeGenerationSchema:
    def test_valid_code_generation(self, v: ParallaxValidator) -> None:
        output = json.dumps({
            "language": "Python",
            "code": "def hello(): return 'world'",
            "passes_tests": True,
            "line_count": 1,
        })
        result = v.validate("CodeGeneration", output)
        assert result.is_valid is True

    def test_zero_line_count_rejected(self, v: ParallaxValidator) -> None:
        output = json.dumps({
            "language": "JS",
            "code": "",
            "passes_tests": False,
            "line_count": 0,
        })
        result = v.validate("CodeGeneration", output)
        assert result.is_valid is False


# ---------------------------------------------------------------------------
# JSON / Schema errors
# ---------------------------------------------------------------------------

class TestValidatorEdgeCases:
    def test_malformed_json(self, v: ParallaxValidator) -> None:
        result = v.validate("PriceCheck", "{broken json}")
        assert result.is_valid is False
        assert any("json" in e.lower() or "parse" in e.lower() for e in result.errors)

    def test_null_output(self, v: ParallaxValidator) -> None:
        result = v.validate("DataExtraction", "null")
        assert result.is_valid is False

    def test_unknown_schema(self, v: ParallaxValidator) -> None:
        result = v.validate("NonExistentSchema", '{"foo": "bar"}')
        assert result.is_valid is False
        assert any("unknown" in e.lower() or "nonexi" in e.lower() for e in result.errors)

    def test_validation_result_has_timing(self, v: ParallaxValidator) -> None:
        output = json.dumps({
            "item_name": "X",
            "price": 1.0,
            "in_stock": True,
            "source_url": "https://x.com",
        })
        result = v.validate("PriceCheck", output)
        assert isinstance(result.time_ms, float)
        assert result.time_ms >= 0.0

    def test_schema_registry_completeness(self) -> None:
        assert "PriceCheck" in SCHEMA_REGISTRY
        assert "DataExtraction" in SCHEMA_REGISTRY
        assert "CodeGeneration" in SCHEMA_REGISTRY
