import os
import httpx
from typing import Dict, Any
from app.judges.base import BaseJudge

class OllamaJudge(BaseJudge):
    def __init__(self):
        provider = os.getenv("JUDGE_PROVIDER", "ollama")
        model = os.getenv("JUDGE_MODEL", "llama3")
        super().__init__(provider=provider, model=model)
        self.base_url = os.getenv("JUDGE_BASE_URL", "http://localhost:11434/api")
        self.timeout = float(os.getenv("JUDGE_TIMEOUT_S", "10"))

    def _call_model(self, prompt: str) -> str:
        payload = {
            "model": self.model,
            "prompt": f"System: You are a JSON-only evaluation engine.\n\nUser: {prompt}",
            "stream": False,
            "format": "json"
        }

        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(f"{self.base_url}/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            return data["response"]
