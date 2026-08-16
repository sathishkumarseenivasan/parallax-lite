# CLI Reference

The `plx` CLI provides quick terminal-based interactions with Parallax.

## Installation
*(Assuming you are in the repo directory)*
```bash
pip install -e cli/
```

## Commands

### `plx status`
Check if the core is online.

### `plx simulate --scenario [name] --count [int]`
Simulate agent traffic. Scenarios: `happy_path`, `drift_spike`.

### `plx verify`
Cryptographically verify the integrity chain of the local ledger.

### `plx init`
Scaffold a `.env` file in the current directory.
