# Claude Desktop Setup

This guide shows how to add the Pocket Network MCP server to Claude Desktop.

## Quick Setup

1. **Open Claude Desktop configuration file:**

**macOS:**
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Or open it manually at: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

2. **Add the MCP server configuration:**

```json
{
  "mcpServers": {
    "grove": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-grove/dist/index.js"]
    }
  }
}
```

**Note:** Replace `/absolute/path/to/mcp-grove` with the actual absolute path to your installation.

3. **Restart Claude Desktop**

Close and reopen the Claude Desktop app for changes to take effect.

4. **Verify it's working**

In Claude Desktop, try asking:
```
List all available blockchain services from Grove
```

or

```
Get the latest height for ethereum
```

You should see the MCP server respond with blockchain data.

## Troubleshooting

### MCP Server Not Appearing

1. Check the config file path is correct
2. Ensure the path to `dist/index.js` is absolute (not relative)
3. Check that you rebuilt the project: `npm run build`
4. Restart Claude Desktop completely

### View MCP Server Logs

Check the Claude Desktop developer console:
- macOS: `Cmd+Option+I` in Claude Desktop
- Look for MCP server startup messages

### Permission Issues

If you get permission errors:

```bash
cd /path/to/mcp-grove
chmod +x dist/index.js
```

### Node.js Not Found

Ensure Node.js is installed and in your PATH:

```bash
which node
# Should output: /usr/local/bin/node or similar
```

If not installed:
```bash
brew install node
```

## Alternative: NPM Global Install (Coming Soon)

Once published to npm, you'll be able to install globally:

```bash
npm install -g mcp-grove
```

And configure with just:
```json
{
  "mcpServers": {
    "grove": {
      "command": "mcp-grove"
    }
  }
}
```

## Configuration File Location by OS

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

## Example Queries to Try

Once configured, try these queries in Claude Desktop:

```
Get the latest block height for ethereum

List all available blockchain networks

What's the current block number on polygon?

Show me supported RPC methods for solana

Call eth_getBalance on ethereum for address 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

## Full Configuration Example

If you have multiple MCP servers:

```json
{
  "mcpServers": {
    "grove": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-grove/dist/index.js"]
    },
    "other-server": {
      "command": "npx",
      "args": ["-y", "some-other-mcp-server"]
    }
  }
}
```

## Uninstalling

To remove the Pocket Network MCP server from Claude Desktop:

1. Open the config file
2. Remove the `"grove"` entry from `mcpServers`
3. Restart Claude Desktop

## Getting Help

- **GitHub Issues:** https://github.com/buildwithgrove/mcp-grove/issues
- **Grove Documentation:** https://api.pocket.network/docs
- **MCP Documentation:** https://modelcontextprotocol.io
