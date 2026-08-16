from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, create_model, Field
from typing import Any
import json
from app.assertions import SCHEMA_REGISTRY

router = APIRouter(prefix="/api/schemas", tags=["schemas"])

class SchemaField(BaseModel):
    name: str
    type: str
    required: bool
    constraints: dict[str, Any] = {}

class SchemaDefinition(BaseModel):
    name: str
    fields: list[SchemaField]

@router.post("")
def register_schema(definition: SchemaDefinition):
    fields = {}
    for f in definition.fields:
        # Determine Python type
        if f.type == "string":
            py_type = str
        elif f.type == "number":
            py_type = float
        elif f.type == "boolean":
            py_type = bool
        elif f.type == "array":
            py_type = list
        elif f.type == "object":
            py_type = dict
        else:
            py_type = Any
            
        # Optionality
        if not f.required:
            py_type = py_type | None
            
        # Field kwargs
        kwargs = {}
        for k, v in f.constraints.items():
            if k == "gt":
                kwargs["gt"] = v
            elif k == "lt":
                kwargs["lt"] = v
            # other constraints could be mapped here...
            
        if f.required:
            fields[f.name] = (py_type, Field(**kwargs))
        else:
            fields[f.name] = (py_type, Field(default=None, **kwargs))
            
    try:
        DynamicModel = create_model(definition.name, **fields)
        SCHEMA_REGISTRY[definition.name] = DynamicModel
        return {"status": "success", "schema_name": definition.name, "json_schema": DynamicModel.model_json_schema()}
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": "PLX-SCHEMA-01", "msg": str(e)})

@router.get("")
def list_schemas():
    return [
        {"name": name, "schema": cls.model_json_schema()} 
        for name, cls in SCHEMA_REGISTRY.items()
    ]
