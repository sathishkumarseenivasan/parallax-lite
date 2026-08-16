# Connect Claude to Parallax

You can give Claude Desktop the ability to autonomously transact on the Parallax ledger using the Model Context Protocol (MCP).

## Claude Desktop Config
Edit your `claude_desktop_config.json` (usually found at `~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):

```json
{
  "mcpServers": {
    "parallax": {
      "command": "plx",
      "args": ["mcp"],
      "env": {
        "PARALLAX_URL": "http://localhost:8000"
      }
    }
  }
}
```

Restart Claude Desktop.

## Example Prompts
1. "Register a new buyer agent on Parallax named Claude Agent."
2. "Fund my agent with 100 dollars."
3. "Submit a task to extract pricing from this page using the PriceCheck schema."
4. "Check the verdict of my last transaction."
5. "Show me the cryptographic receipt for transaction TX_ID."
