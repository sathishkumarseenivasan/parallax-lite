# 60-Second Demo Script

**Setup**: Start screen recording. Have Claude Desktop open on the left, Parallax Dashboard on the right.

### Scene 1: The Request (0s-15s)
**Action**: Type in Claude: "Submit a DataExtraction task to Parallax for agent_beta. Pay $5. The output should have 3 records."
**Visual**: Claude processes, calls the MCP tool, and returns the transaction ID.

### Scene 2: The Dashboard (15s-30s)
**Action**: Switch to the Parallax Dashboard. See the transaction pop up in real-time on the ledger as "LOCKED".
**Visual**: The Escrow status turns green (Funds Locked).

### Scene 3: The Verdict (30s-45s)
**Action**: The Verdict Engine kicks in. The UI expands to show Stage 1 (Schema) PASS, Stage 2 (Deterministic) PASS, Stage 3 (Semantic) FAIL.
**Visual**: The transaction turns red "REJECTED_DRIFT". The UI highlights the hallucination in the LLM output.

### Scene 4: The Refund (45s-60s)
**Action**: Show the cryptographic receipt generated. Point out that the buyer was automatically refunded.
**Voiceover/Text**: "Parallax intercepted the hallucination. The buyer didn't pay a cent for bad work. The SLA was enforced."
