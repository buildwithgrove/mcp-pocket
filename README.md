# Grove's Public Endpoints for Pocket Network

An extensible MCP (Model Context Protocol) server for surfacing Grove's **public endpoints** for Pocket Network and documentation.

> **💡 Public Endpoints + Optional Portal Support**: This MCP server uses Grove's free, public RPC endpoints by default. You can optionally provide your Grove Portal appId for higher rate limits. Get a free appId at [portal.grove.city](https://portal.grove.city).

## Features

- **Public RPC Access**: Query 69+ blockchain networks via Grove's free public endpoints
- **Natural Language Queries**: Ask questions like "get the latest height for ethereum"
- **Live JSON-RPC Calls**: Execute blockchain RPC methods directly from Claude Code
- **Domain Name Resolution**: Resolve ENS (.eth) and Unstoppable Domains to addresses
- **Custom Portal Support**: Optional appId parameter for higher rate limits via Grove Portal
- **No Authentication Required**: Uses public endpoints by default - no API keys needed
- **Documentation Integration**: Access docs.grove.city content seamlessly
- **Easy Extensibility**: Add new blockchains via configuration

## Installation

```bash
npm install
npm run build
```

## Adding to Claude Desktop

Add to your Claude Desktop MCP configuration at `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "grove": {
      "command": "node",
      "args": ["/path/to/mcp-grove/dist/index.js"]
    }
  }
}
```

For detailed setup instructions, see [CLAUDE_DESKTOP_SETUP.md](CLAUDE_DESKTOP_SETUP.md).

## Available Tools

### Blockchain RPC Tools (Primary Features)

- `query_blockchain` - **Natural language queries** (e.g., "get the latest height for ethereum")
- `list_blockchain_services` - List all available blockchain networks
- `get_blockchain_service` - Get details about a specific blockchain including supported methods
- `call_rpc_method` - Call a JSON-RPC method directly on any blockchain
- `get_supported_methods` - Get all RPC methods for a blockchain
- `resolve_domain` - **Resolve ENS (.eth) and Unstoppable Domains** to blockchain addresses

### Endpoint Management

- `list_endpoints` - List all endpoints (optionally filter by category)
- `get_endpoint_details` - Get detailed info about a specific endpoint
- `call_endpoint` - Execute an endpoint with parameters
- `list_categories` - List all available categories
- `add_endpoint` - Dynamically add a new endpoint at runtime

### Documentation

- `get_doc_page` - Retrieve a specific documentation page
- `get_endpoint_docs` - Get docs for a specific endpoint
- `search_docs` - Search documentation content

## Extending with New Blockchains

To add support for a new blockchain network:

1. Edit `src/config/blockchain-services.json`
2. Add a new service entry:

```json
{
  "id": "newchain-mainnet",
  "name": "New Chain Mainnet",
  "blockchain": "newchain",
  "network": "mainnet",
  "rpcUrl": "https://newchain.rpc.grove.city/v1/01fdb492",
  "protocol": "json-rpc",
  "category": "evm",
  "supportedMethods": [
    {
      "name": "eth_blockNumber",
      "description": "Returns the latest block number",
      "params": [],
      "category": "block"
    }
  ]
}
```

3. Rebuild: `npm run build`
4. Restart Claude Desktop

For more details, see [EXTENDING.md](EXTENDING.md).

## Architecture

```
src/
├── index.ts                       # MCP server entry point
├── types.ts                       # TypeScript type definitions
├── config/
│   ├── blockchain-services.json   # Blockchain network configurations
│   └── endpoints.json             # HTTP endpoint configurations
└── services/
    ├── blockchain-service.ts      # Blockchain RPC calls & natural language queries
    ├── endpoint-manager.ts        # Generic HTTP endpoint manager
    └── docs-manager.ts            # Documentation retrieval
```

## Development

Watch mode for development:

```bash
npm run watch
```

## Supported Blockchains

**69 blockchain networks** available via Grove's public endpoints:

**EVM Chains:**
Ethereum, Polygon, BSC, Avalanche, Gnosis, Celo, Fantom, Harmony, Moonbeam, Moonriver, Fuse, IoTeX, Oasys, Kaia, Berachain, Sonic, Ink, XRPL EVM

**Layer 2 Solutions:**
Arbitrum, Optimism, Base, zkSync Era, zkLink Nova, Scroll, Linea, Mantle, Blast, Boba, Metis, Taiko, Unichain, opBNB, Fraxtal, Polygon zkEVM

**Cosmos Ecosystem:**
Osmosis, Juno, Akash, Kava, Persistence, Stargaze, AtomOne, Cheqd, Chihuahua, Fetch.ai, Hyperliquid, Jackal, Pocket Network, Seda, Sei, Shentu

**Non-EVM:**
Solana, NEAR, Sui, Tron, Radix

**Plus testnets** for Ethereum, Polygon, Arbitrum, Optimism, Base, Taiko, XRPL EVM, Giwa

Most chains use public endpoint ID `01fdb492`. Some chains have **foundation-sponsored endpoints** with better performance (Kaia, XRPL EVM, Radix) - these are automatically preferred.

## Example Usage

Once configured in Claude Desktop, you can:

### Blockchain Queries (Primary Use Case)

```
Get the latest height for ethereum

What's the current block number on polygon?

List all available blockchain services

Show me supported methods for solana

Call eth_getBalance on ethereum for address 0x...

Resolve vitalik.eth

What address does alice.crypto resolve to?
```

### Using Custom AppId (For Higher Rate Limits)

If you encounter rate limits with public endpoints, you can provide your Grove Portal appId:

```
Call eth_blockNumber on ethereum with appId "YOUR_APP_ID"

Get balance for address 0x... on polygon using appId "YOUR_APP_ID"
```

Get your free appId from [portal.grove.city](https://portal.grove.city)

### General Endpoint & Documentation

```
Show me all available Grove endpoints

Search the Grove documentation for "authentication"

Get the public endpoints page
```

For detailed blockchain usage examples, see [BLOCKCHAIN_USAGE.md](BLOCKCHAIN_USAGE.md).

## License

MIT
