import os
import hvac
from typing import Dict, Any

class VaultClient:
    """
    Enterprise Zero-Trust Secrets Fetcher using HashiCorp Vault.
    Authenticates via Kubernetes ServiceAccount JWT to retrieve production secrets.
    """
    
    def __init__(self):
        self.vault_url = os.environ.get("VAULT_ADDR", "http://vault:8200")
        self.vault_role = os.environ.get("VAULT_ROLE", "parallax-proxy-role")
        self.secret_path = os.environ.get("VAULT_SECRET_PATH", "parallax/prod")
        self.jwt_path = os.environ.get("K8S_JWT_PATH", "/var/run/secrets/kubernetes.io/serviceaccount/token")
        
        self.client = hvac.Client(url=self.vault_url)
        self.secrets: Dict[str, Any] = {}

    def _read_k8s_jwt(self) -> str:
        """Reads the injected Kubernetes ServiceAccount JWT."""
        try:
            with open(self.jwt_path, "r") as f:
                return f.read().strip()
        except FileNotFoundError:
            # Fallback for local development if allowed, but in strict enterprise mode:
            raise RuntimeError(f"Kubernetes JWT not found at {self.jwt_path}. Are we running in a cluster?")

    def authenticate(self) -> None:
        """Authenticates with Vault using the K8s JWT."""
        # Skip auth if a dev token is provided via env (for local testing only)
        if os.environ.get("VAULT_TOKEN"):
            self.client.token = os.environ.get("VAULT_TOKEN")
            return

        jwt = self._read_k8s_jwt()
        
        try:
            # Login to Vault via the Kubernetes auth method
            hvac.api.auth_methods.Kubernetes(self.client.adapter).login(
                role=self.vault_role,
                jwt=jwt
            )
        except hvac.exceptions.VaultError as e:
            raise RuntimeError(f"Failed to authenticate with Vault: {str(e)}")

        if not self.client.is_authenticated():
            raise RuntimeError("Vault authentication failed. No valid token obtained.")

    def fetch_secrets(self) -> None:
        """Fetches the required secrets and caches them in memory."""
        try:
            # Using KV engine v2 by default
            read_response = self.client.secrets.kv.v2.read_secret_version(
                path=self.secret_path
            )
            self.secrets = read_response['data']['data']
        except hvac.exceptions.InvalidPath:
            raise RuntimeError(f"Vault secret path '{self.secret_path}' does not exist.")
        except hvac.exceptions.Forbidden:
            raise RuntimeError(f"Access denied to Vault secret path '{self.secret_path}'. Check K8s Role bindings.")
        except hvac.exceptions.VaultDown:
            raise RuntimeError("Vault is unreachable. Failing securely.")
        except Exception as e:
            raise RuntimeError(f"An unexpected error occurred while fetching secrets: {str(e)}")

    def get_secret(self, key: str, default: Any = None) -> Any:
        """Retrieves a specific secret, falling back to environment variables or defaults."""
        return self.secrets.get(key, os.environ.get(key, default))

# Singleton instance to be used during FastAPI lifespan
vault_client = VaultClient()

def init_vault():
    """
    Initialize Vault and fetch secrets.
    Call this function during the FastAPI lifespan startup event.
    """
    # In a local non-K8s environment without a VAULT_TOKEN, this will fail safely unless mocked.
    # To bypass in local dev without vault, set DISABLE_VAULT=true
    if os.environ.get("DISABLE_VAULT", "false").lower() == "true":
        print("WARNING: Vault integration disabled. Using local environment variables.")
        return

    print("Authenticating to HashiCorp Vault via K8s ServiceAccount...")
    vault_client.authenticate()
    print("Fetching production secrets...")
    vault_client.fetch_secrets()
    print("Secrets loaded successfully.")
