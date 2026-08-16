from typing import Any, Type, List, Dict
from pydantic import BaseModel

class GuardField:
    def __init__(self, name: str, parent: 'DriftGuard'):
        self.name = name
        self.parent = parent
        self.rules = []

    def gt(self, value: float) -> 'GuardField':
        self.rules.append(('gt', value))
        return self

    def lt(self, value: float) -> 'GuardField':
        self.rules.append(('lt', value))
        return self

    def is_bool(self) -> 'GuardField':
        self.rules.append(('is_bool', None))
        return self

    def field(self, name: str) -> 'GuardField':
        return self.parent.field(name)

    def validate(self, data: Dict[str, Any]) -> List[str]:
        errors = []
        val = data.get(self.name)
        if val is None:
            return [f"Field {self.name} is missing"]
        
        for rule, arg in self.rules:
            if rule == 'gt' and not (val > arg):
                errors.append(f"Field {self.name} must be > {arg}, got {val}")
            elif rule == 'lt' and not (val < arg):
                errors.append(f"Field {self.name} must be < {arg}, got {val}")
            elif rule == 'is_bool' and not isinstance(val, bool):
                errors.append(f"Field {self.name} must be boolean, got {type(val).__name__}")
        return errors

class DriftGuard:
    def __init__(self):
        self._schema = None
        self._fields = {}

    def schema(self, schema_cls: Type[BaseModel]) -> 'DriftGuard':
        self._schema = schema_cls
        return self

    def field(self, name: str) -> GuardField:
        f = GuardField(name, self)
        self._fields[name] = f
        return f
        
    def validate(self, data: Dict[str, Any]) -> List[str]:
        errors = []
        if self._schema:
            try:
                self._schema(**data)
            except Exception as e:
                errors.append(f"Schema validation failed: {str(e)}")
        
        for f in self._fields.values():
            errors.extend(f.validate(data))
            
        return errors

guard = DriftGuard()
