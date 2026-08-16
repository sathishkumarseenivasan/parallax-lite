# Demo GIF Script

**Goal:** A fast-paced, 60-second screen recording showing the power of Parallax from setup to error handling.

**Scene 1: The Boot (0:00 - 0:10)**
- Terminal 1: User runs `make dev`. Docker containers spin up fast.
- Browser: Switch to localhost:3000. The dashboard is empty but online. 

**Scene 2: Live Stream (0:10 - 0:25)**
- Terminal 2: User runs `make seed` (which calls `plx simulate`).
- Browser: Side-by-side view. Terminal outputs green `CLEARED`, and the dashboard instantly populates with rows flashing green via websocket. Trust scores tick upwards.

**Scene 3: The Hallucination (0:25 - 0:40)**
- Terminal 2: User runs `python examples/hallucination_catch.py`.
- Terminal outputs red `REJECTED: PLX-100`.
- Browser: Row flashes red on the dashboard. 

**Scene 4: Drift Inspector (0:40 - 0:50)**
- Browser: User clicks on the rejected transaction row.
- The Inspector modal opens, showing the diff: expected a boolean `in_stock`, but got the string `"yes"`. The "Refunded" badge is clearly visible.

**Scene 5: Verification (0:50 - 1:00)**
- Terminal 2: User runs `plx verify`.
- CLI outputs `● Chain is VALID` in green text.
- Text overlay: "Parallax: Trust, but computationally verify."
