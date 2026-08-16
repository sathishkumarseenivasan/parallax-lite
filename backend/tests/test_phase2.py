import pytest
from app.driftguard import guard
from pydantic import BaseModel
from app.errors import PLXError, ValidationError

class DummySchema(BaseModel):
    price: float
    in_stock: bool

def test_driftguard_dsl():
    g = guard.schema(DummySchema)
    g.field("price").gt(0)
    g.field("in_stock").is_bool()
    
    # Happy path
    errors = g.validate({"price": 10.5, "in_stock": True})
    assert len(errors) == 0
    
    # Drift
    errors = g.validate({"price": -5, "in_stock": "yes"})
    assert len(errors) >= 2 # Schema error for 'yes' to bool, and price > 0

def test_error_code_contract():
    err = ValidationError()
    assert err.code == "PLX-100"
    assert "error" not in err.to_dict() # Checking we flattened it
    assert err.to_dict()["code"] == "PLX-100"
    assert "docs" in err.to_dict()
