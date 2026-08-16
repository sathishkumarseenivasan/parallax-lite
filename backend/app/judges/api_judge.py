import os
import httpx
from typing import Dict, Any
from app.judges.base import BaseJudge

class APIJudge(BaseJudge):
    def __init__(self):
        provider = os.getenv("JUDGE_PROVIDER", "api")
        model = os.getenv("JUDGE_MODEL", "gpt-3.5-turbo")
        super().__init__(provider=provider, model=model)
        self.base_url = os.getenv("JUDGE_BASE_URL", "https://api.openai.com/v1")
        self.api_key = os.getenv("JUDGE_API_KEY", "")
        self.timeout = float(os.getenv("JUDGE_TIMEOUT_S", "10"))
        
    def _call_model(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a JSON-only evaluation engine."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.0,
            "response_format": {"type": "json_object"}
        }

        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
