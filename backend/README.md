# Parallax Lite — Backend

Python/FastAPI backend for the Parallax Lite escrow validation service.

## Setup

```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Seed demo data (25 transactions, 2 agents)
python -m app.seed_data

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

## Run Tests

```bash
pytest -v
```

## API Reference

| Method | Endpoint                    | Description                         |
|--------|-----------------------------|-------------------------------------|
| GET    | /api/health                 | Liveness check                      |
| GET    | /api/agents                 | List all agents                     |
| POST   | /api/agents                 | Create an agent                     |
| POST   | /api/agents/seed            | Seed demo data                      |
| GET    | /api/transactions           | List transactions (limit, status)   |
| POST   | /api/transactions/submit    | Submit a task for validation        |
| GET    | /api/transactions/{id}      | Get single transaction              |
| GET    | /api/metrics                | Get dashboard metrics               |
