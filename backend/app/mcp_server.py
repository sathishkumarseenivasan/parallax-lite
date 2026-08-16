"""
MCP Server for Parallax Lite.
Uses the low-level mcp.server API (compatible with mcp==1.0.0).
The tool logic is extracted into execute_verified_task() so it can be
tested and called independently of the MCP transport layer.

Usage:
    python -m app.mcp_server
"""
import asyncio
import logging

from app.assertions import validator
from app.database import SessionLocal, init_db
from app.ledger import InsufficientFundsError, ledger
from app.models import Agent

logger = logging.getLogger(__name__)


def _ensure_db() -> None:
    """Ensure DB tables exist and default agents are seeded."""
    init_db()
    db = SessionLocal()
    try:
        if db.get(Agent, "agent_alpha") is None:
            db.add(Agent(id="agent_alpha", name="Agent Alpha", role="buyer", balance=1000.0))
        if db.get(Agent, "agent_beta") is None:
            db.add(Agent(id="agent_beta", name="Agent Beta", role="seller", balance=0.0))
        db.commit()
    finally:
        db.close()


async def execute_verified_task(
    buyer_id: str,
    seller_id: str,
    task_description: str,
    expected_schema_name: str,
    payment_amount: float,
    simulated_output: str,
) -> str:
    """
    Parallax Clearinghouse: Execute a verified agent-to-agent transaction.

    This function intercepts payment, validates the seller's output against the
    declared schema, and only releases funds if the output is correct.

    Args:
        buyer_id:             ID of the agent initiating the purchase.
        seller_id:            ID of the agent delivering the output.
        task_description:     Human-readable description of the task.
        expected_schema_name: Schema to validate against (PriceCheck | DataExtraction | CodeGeneration).
        payment_amount:       Credits to transfer on success.
        simulated_output:     Raw JSON string from the seller agent.

    Returns:
        A detailed settlement report as a formatted string.
    """
    _ensure_db()
    db = SessionLocal()
    report_lines: list[str] = []

    try:
        report_lines.append("=" * 48)
        report_lines.append("     PARALLAX LITE CLEARINGHOUSE")
        report_lines.append("=" * 48)
        report_lines.append(f"Task        : {task_description}")
        report_lines.append(f"Buyer       : {buyer_id}")
        report_lines.append(f"Seller      : {seller_id}")
        report_lines.append(f"Payment     : {payment_amount:.4f} credits")
        report_lines.append(f"Schema      : {expected_schema_name}")
        report_lines.append("-" * 48)

        # Step 1: Lock escrow
        report_lines.append("[1/3] Locking escrow...")
        try:
            tx = ledger.lock_escrow(
                db=db,
                buyer_id=buyer_id,
                seller_id=seller_id,
                amount=payment_amount,
                schema_name=expected_schema_name,
                simulated_output=simulated_output,
            )
            report_lines.append(f"      [OK] Escrow locked. TX ID: {tx.id}")
        except InsufficientFundsError as exc:
            report_lines.append(f"      FAILED: {exc}")
            return "\n".join(report_lines)
        except LookupError as exc:
            report_lines.append(f"      FAILED: {exc}")
            return "\n".join(report_lines)

        # Step 2: Validate output
        report_lines.append("[2/3] Validating seller output...")
        result = validator.validate(expected_schema_name, simulated_output)
        report_lines.append(f"      Validation time: {result.time_ms:.2f}ms")

        # Store timing
        tx.validation_time_ms = result.time_ms
        db.commit()

        # Step 3: Settle
        report_lines.append("[3/3] Settling transaction...")
        if result.is_valid:
            tx = ledger.clear_escrow(db=db, transaction_id=tx.id)
            report_lines.append("-" * 48)
            report_lines.append("OUTCOME : [OK] CLEARED")
            report_lines.append(f"          {payment_amount:.4f} credits released to {seller_id}")
        else:
            reason = "; ".join(result.errors)
            tx = ledger.reject_escrow(db=db, transaction_id=tx.id, reason=reason)
            report_lines.append("-" * 48)
            report_lines.append("OUTCOME : [REJECTED] Semantic Drift Detected")
            report_lines.append(f"          {payment_amount:.4f} credits refunded to {buyer_id}")
            report_lines.append("ERRORS  :")
            for err in result.errors:
                report_lines.append(f"  - {err}")

        report_lines.append("=" * 48)

    finally:
        db.close()

    return "\n".join(report_lines)


if __name__ == "__main__":
    # Try to use FastMCP if available (mcp>=1.1.0), else print usage instructions
    _ensure_db()
    try:
        from mcp.server.fastmcp import FastMCP  # type: ignore

        mcp = FastMCP("parallax-lite")

        @mcp.tool()
        async def _execute_verified_task(
            buyer_id: str,
            seller_id: str,
            task_description: str,
            expected_schema_name: str,
            payment_amount: float,
            simulated_output: str,
        ) -> str:
            """Parallax Clearinghouse: Execute a verified agent-to-agent transaction."""
            return await execute_verified_task(
                buyer_id, seller_id, task_description,
                expected_schema_name, payment_amount, simulated_output,
            )

        mcp.run()

    except ImportError:
        # mcp==1.0.0 — run a quick smoke test instead
        logger.info("FastMCP not available (mcp==1.0.0). Running smoke test...")
        result = asyncio.run(execute_verified_task(
            buyer_id="agent_alpha",
            seller_id="agent_beta",
            task_description="Test transaction",
            expected_schema_name="PriceCheck",
            payment_amount=1.0,
            simulated_output='{"item_name":"Test","price":9.99,"currency":"USD","in_stock":true,"source_url":"http://test.com"}',
        ))
        print(result)
