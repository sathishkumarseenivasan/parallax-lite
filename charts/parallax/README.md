# Parallax Protocol - Enterprise Helm Chart

This Helm Chart encapsulates the deployment logic for the Parallax Phase 4.4 Enterprise Node.

## Structure

```text
charts/parallax/
├── Chart.yaml              # Basic metadata
├── values.yaml             # Secure defaults and configuration
├── README.md               # This documentation
└── templates/
    ├── deployment.yaml     # FastAPI Proxy deployment with strict security contexts
    ├── _helpers.tpl        # Common naming logic
    └── ...                 # (Services, HPA, RBAC to be extended)
```

## Security & Compliance Features

This chart is heavily opinionated for SOC2 compliance and Enterprise constraints:

1. **Rootless Execution**: `podSecurityContext` enforces `runAsNonRoot: true`. 
2. **Read-Only Root Filesystem**: We strictly enforce `readOnlyRootFilesystem: true`. The FastAPI proxy relies on a mounted `emptyDir` at `/tmp` for any temporary runtime files.
3. **Privilege Escalation Blocked**: `allowPrivilegeEscalation: false` and all capabilities are dropped (`drop: ["ALL"]`).
4. **Zero-Trust Secrets**: Secrets are NOT passed as plain-text environment variables. The `VAULT_*` variables point the internal FastAPI client to authenticate with a local HashiCorp Vault using the Kubernetes ServiceAccount token (`/var/run/secrets/kubernetes.io/serviceaccount/token`).

## External Databases

By default, we assume PostgreSQL and Redis are managed externally (e.g. AWS RDS Multi-AZ, AWS ElastiCache) for disaster recovery purposes. The Vault integration dynamically fetches the connection URLs for these data stores on application startup.

## Quickstart

Render the templates locally to inspect the output:
```bash
helm template parallax ./charts/parallax -f ./charts/parallax/values.yaml
```

Deploy to the cluster:
```bash
helm upgrade --install parallax ./charts/parallax --namespace parallax-enterprise --create-namespace
```
