import json
import re
from xml.etree import ElementTree as ET
from typing import Any, Dict

from app.errors import ValidationError

def normalize_to_json(raw_input: str) -> Dict[str, Any]:
    """
    STAGE 0: Dialect Normalization
    Translates XML / Markdown / YAML agent outputs into canonical JSON.
    Raises ValidationError (PLX-1xx) if unparseable.
    """
    raw_input = raw_input.strip()
    if not raw_input:
        raise ValidationError("Empty output", details={"code": "PLX-101"})

    # 1. Try raw JSON
    try:
        return json.loads(raw_input)
    except json.JSONDecodeError:
        pass

    # 2. Try Markdown-wrapped JSON
    md_match = re.search(r"```(?:json)?\s*(.*?)\s*```", raw_input, re.DOTALL)
    if md_match:
        try:
            return json.loads(md_match.group(1))
        except json.JSONDecodeError:
            pass

    # 3. Try XML (basic to dict)
    if raw_input.startswith("<") and raw_input.endswith(">"):
        try:
            root = ET.fromstring(raw_input)
            result = {}
            for child in root:
                result[child.tag] = child.text
            if result:
                return result
        except ET.ParseError:
            pass

    # 4. Try basic YAML-like key: value
    lines = raw_input.split('\n')
    yaml_dict = {}
    is_yaml = False
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if ':' in line:
            parts = line.split(':', 1)
            key = parts[0].strip()
            val = parts[1].strip()
            if val.startswith('"') and val.endswith('"'):
                val = val[1:-1]
            elif val.startswith("'") and val.endswith("'"):
                val = val[1:-1]
            yaml_dict[key] = val
            is_yaml = True
        else:
            is_yaml = False
            break
    if is_yaml and yaml_dict:
        return yaml_dict

    raise ValidationError("Could not parse output dialect to canonical JSON", details={"code": "PLX-102"})
