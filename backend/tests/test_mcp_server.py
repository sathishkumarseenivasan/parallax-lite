"""
Integration tests for the MCP server tool.
Tests the execute_verified_task tool end-to-end against an in-memory DB.
"""
import json
from unittest.mock import patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import Agent


@pytest.fixture(autouse=True)
def reset_db(tmp_path, monkeypatch):
    """
    Patch the MCP server to use a fresh in-memory SQLite database.
    This avoids polluting the real parallax.db during tests.
    """
    test_db_url = f"sqlite:///{tmp_path}/test.db"
    from sqlalchemy import create_engine as _ce
    from sqlalchemy.orm import sessionmaker as _sm

    test_engine = _ce(test_db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)
    from sqlalchemy import text
    with test_engine.begin() as conn:
        conn.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS transactions_fts USING fts5(
                id, task_description, rejection_reason, buyer_name, seller_name
            );
        """))
    TestSession = _sm(bind=test_engine)

    # Seed test agents
    db = TestSession()
    db.add(Agent(id="agent_alpha", name="Agent Alpha", role="buyer", balance=500.0))
    db.add(Agent(id="agent_beta", name="Agent Beta", role="seller", balance=0.0))
    db.commit()
    db.close()

    monkeypatch.setattr("app.mcp_server.SessionLocal", TestSession)
    monkeypatch.setattr("app.mcp_server.init_db", lambda: None)
    monkeypatch.setattr("app.mcp_server._ensure_db", lambda: None)

    yield test_engine
    Base.metadata.drop_all(bind=test_engine)


class TestMCPServer:
    """Integration tests for the execute_verified_task MCP tool."""

    @pytest.mark.asyncio
    async def test_valid_transaction_clears(self) -> None:
        """Valid output should result in a CLEARED outcome in the report."""
        from app.mcp_server import execute_verified_task

        valid_output = json.dumps({
            "item_name": "Monitor",
            "price": 399.99,
            "currency": "USD",
            "in_stock": True,
            "source_url": "https://shop.example.com/monitor",
        })

        report = await execute_verified_task(
            buyer_id="agent_alpha",
            seller_id="agent_beta",
            task_description="Check the price of a monitor",
            expected_schema_name="PriceCheck",
            payment_amount=2.5,
            simulated_output=valid_output,
        )

        assert "CLEARED" in report
        assert "2.5000 credits released to agent_beta" in report

    @pytest.mark.asyncio
    async def test_invalid_output_rejected(self) -> None:
        """Invalid output should result in a REJECTED outcome and refund message."""
        from app.mcp_server import execute_verified_task

        bad_output = '{"broken json here'

        report = await execute_verified_task(
            buyer_id="agent_alpha",
            seller_id="agent_beta",
            task_description="Extract pricing data",
            expected_schema_name="PriceCheck",
            payment_amount=1.0,
            simulated_output=bad_output,
        )

        assert "REJECTED" in report
        assert "1.0000 credits refunded to agent_alpha" in report

    @pytest.mark.asyncio
    async def test_insufficient_funds_reported(self) -> None:
        """Insufficient funds should appear in the report without crashing."""
        from app.mcp_server import execute_verified_task

        report = await execute_verified_task(
            buyer_id="agent_alpha",
            seller_id="agent_beta",
            task_description="Expensive task",
            expected_schema_name="CodeGeneration",
            payment_amount=99999.0,
            simulated_output="{}",
        )

        assert "FAILED" in report

    @pytest.mark.asyncio
    async def test_report_contains_tx_id(self) -> None:
        """The settlement report must include the transaction ID."""
        from app.mcp_server import execute_verified_task

        valid_output = json.dumps({
            "language": "Python",
            "code": "print('hello')",
            "passes_tests": True,
            "line_count": 1,
        })

        report = await execute_verified_task(
            buyer_id="agent_alpha",
            seller_id="agent_beta",
            task_description="Generate a hello-world script",
            expected_schema_name="CodeGeneration",
            payment_amount=0.5,
            simulated_output=valid_output,
        )

        assert "TX ID:" in report
