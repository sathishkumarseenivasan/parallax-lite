# Parallax Protocol - Enterprise Helm Deployment

This guide outlines how to deploy Phase 4 of the Parallax Protocol (Enterprise Tier) into a Kubernetes cluster using Helm.

## Architecture Overview

The Enterprise Helm chart deploys the following stateful and stateless components:

- **parallax-proxy** (Deployment + HPA): The core FastAPI proxy routing agent interactions and escrow logic.
- **parallax-worker** (Deployment + HPA): Celery background workers that handle LLM calls for Schema/Validation verdicts.
- **postgres-ha** (StatefulSet): High Availability PostgreSQL for storing `Enterprise_Orgs`, `Audit_Logs`, and `Transactions`.
- **redis** (StatefulSet / Deployment): Caching and background task queues.

## Prerequisites

1. Kubernetes cluster (v1.24+)
2. Helm 3 installed
3. Ingress controller (e.g., NGINX, ALB)
4. A Vault instance or configured Kubernetes Secrets for injecting API keys.

## Quickstart

1. **Create the Namespace**
   ```bash
   kubectl create namespace parallax-enterprise
   ```

2. **Configure Secrets**
   Before installing the chart, create a secret containing your LLM API Keys and JWT secrets (or use ExternalSecrets / HashiCorp Vault).
   ```bash
   kubectl create secret generic parallax-secrets \
     --namespace parallax-enterprise \
     --from-literal=OPENAI_API_KEY="sk-..." \
     --from-literal=ADMIN_JWT_SECRET="your-256-bit-secret"
   ```

3. **Install the Helm Chart**
   From your customized values file (`values-prod.yaml`):
   ```bash
   helm upgrade --install parallax-node ./charts/parallax \
     --namespace parallax-enterprise \
     -f values-prod.yaml
   ```

## Production Considerations (SOC2)

- **Immutable Audit Logging**: The application layer hashes OpenTelemetry audit logs. Ensure your PostgreSQL instance has WAL archiving turned on and backed up to an immutable S3 bucket with Object Lock.
- **RBAC & Escrow**: The `POST /api/v1/escrow/{tx_id}/approve` HITL endpoint is protected by JWT. Ensure the ingress rules explicitly limit the IP ranges allowed to call `/api/v1/escrow/*/approve`.
- **Secrets Management**: Do not store plain-text secrets in Git. Use HashiCorp Vault Agent Injector or AWS Secrets Manager synced to Kubernetes.

## Upgrading

When a new Parallax Protocol schema is released:
```bash
helm upgrade parallax-node ./charts/parallax --namespace parallax-enterprise --set image.tag=v4.1.0
```
