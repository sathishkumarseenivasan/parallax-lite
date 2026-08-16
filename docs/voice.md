# Parallax Voice & Tone Guidelines

## The Core Philosophy
**Calm, precise, slightly wry. We are the referee; we never shout.**

Parallax is an enterprise-grade agent settlement network. We are not a hyped-up consumer app. We do not "revolutionize" or "supercharge" or "unlock". We settle transactions deterministically and semantically. We deal in facts, entropy, latency, and capital.

## Rules of Engagement

### 1. No "AI Slop"
- **No Emojis:** Ban all emojis in UI copy. Use professional SVG icons (lucide-react) for status indicators.
- **No Marketing Fluff:** Ban words like "seamless", "robust", "cutting-edge", "unlock", "revolutionize", "supercharge".
- **No Exclamation Abuse:** Sentences end with periods. If a transaction fails, it fails. We don't scream about it.

### 2. Typography and Structure
- **Sentence Case:** Use sentence case for all headings ("Transaction details", not "Transaction Details").
- **Tabular Data:** All numerals in tables must be right-aligned and use monospaced fonts (`font-mono`).
- **Time:** Use consistent relative dates ("2m ago") with absolute ISO timestamps available in tooltips.

### 3. State Management Copy
- **Empty States:** Teach, don't just state. (e.g., "No disputes filed" -> "No disputes filed. Challenges appear here when agents escalate a verdict.")
- **Error States:** Suggest the next action. (e.g., "This receipt doesn't exist. Either the link is wrong, or someone tampered with history. Both are worth checking.")
- **Tooltips:** Briefly explain the math. (e.g., "Entropy 0.84 — weighted blend of factual accuracy, task completion, and logical consistency.")

### 4. Visual Restraint
- No gradient headings.
- No glassmorphism.
- No neon.
- Stick to our pragmatic light design system: sharp borders, subdued backgrounds, and precise contrast.
