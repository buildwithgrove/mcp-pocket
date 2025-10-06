# Grove's Public Endpoints for Pocket Network

An extensible MCP (Model Context Protocol) server for surfacing Grove's **public endpoints** for Pocket Network and documentation.

> **💡 Public Endpoints + Optional Portal Support**: This MCP server uses Grove's free, public RPC endpoints by default. You can optionally provide your Grove Portal appId for higher rate limits. Get a free appId at [portal.grove.city](https://portal.grove.city).

## Features

### Core Blockchain Access
- **Public RPC Access**: Query 69+ blockchain networks via Grove's free public endpoints
- **Natural Language Queries**: Ask questions like "get the latest height for ethereum"
- **Live JSON-RPC Calls**: Execute blockchain RPC methods directly from Claude Code
- **Custom Portal Support**: Optional appId parameter for higher rate limits via Grove Portal
- **No Authentication Required**: Uses public endpoints by default - no API keys needed

### Advanced Features
- **Domain Resolution**: Resolve ENS (.eth) and Unstoppable Domains to addresses
- **Reverse Resolution**: Find ENS names from addresses
- **Transaction Analysis**: Get transaction details, receipts, and gas estimates
- **Token Operations**: Query ERC-20 balances and metadata
- **Multi-Chain Comparison**: Compare balances across all EVM chains simultaneously
- **Block Exploration**: Get detailed block data and search event logs
- **Smart Contract Calls**: Execute read-only contract functions
- **Historical Queries**: Check balances at specific block heights
- **Utility Tools**: Convert units, validate addresses, decode hex data

### Additional
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

### Core Blockchain Tools

- `query_blockchain` - **Natural language queries** (e.g., "get the latest height for ethereum")
- `list_blockchain_services` - List all available blockchain networks
- `get_blockchain_service` - Get details about a specific blockchain including supported methods
- `call_rpc_method` - Call a JSON-RPC method directly on any blockchain
- `get_supported_methods` - Get all RPC methods for a blockchain

### Domain Resolution

- `resolve_domain` - Resolve ENS (.eth) or Unstoppable Domains to addresses
- `reverse_resolve_domain` - Reverse resolve Ethereum address to ENS name
- `get_domain_records` - Get ENS text records (avatar, email, twitter, etc.)

### Transaction & Block Tools

- `get_transaction` - Get transaction details by hash
- `get_transaction_receipt` - Get transaction receipt with status, gas used, logs
- `estimate_gas` - Estimate gas required for a transaction
- `get_block_details` - Get detailed block information with optional full transactions
- `search_logs` - Search event logs by address and topics

### Token Tools

- `get_token_balance` - Get ERC-20 token balance for an address
- `get_token_metadata` - Get token name, symbol, decimals, total supply

### Multi-Chain & Analysis

- `compare_balances` - Compare native token balance across multiple EVM chains
- `get_historical_balance` - Get balance at a specific block height
- `get_gas_price` - Get current gas price for a blockchain

### Smart Contract Tools

- `call_contract_view` - Call a read-only contract function

### Utility Tools

- `convert_units` - Convert between wei, gwei, and eth
- `validate_address` - Validate address format for a blockchain
- `decode_hex` - Decode hex string to UTF-8, ASCII, and bytes

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

### Blockchain Queries

```
Get the latest height for ethereum

What's the current block number on polygon?

List all available blockchain services

Show me supported methods for solana

Call eth_getBalance on ethereum for address 0x...
```

### Domain Resolution

```
Resolve vitalik.eth

What address does alice.crypto resolve to?

Reverse resolve address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

Get domain records for vitalik.eth with keys ["avatar", "url", "com.twitter"]
```

### Transaction Analysis

```
Get transaction 0xabc123... on ethereum

Get transaction receipt for 0xabc123... on ethereum

Estimate gas for transferring 1 ETH from 0x... to 0x... on ethereum
```

### Token Operations

```
Get USDC balance for address 0x... on ethereum

Get token metadata for USDC on ethereum (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)
```

### Multi-Chain Analysis

```
Compare balances for address 0x... across all EVM chains

Get gas price on ethereum

Get historical balance of 0x... at block 18000000 on ethereum
```

### Utilities

```
Convert 1000000000 wei to eth

Validate address 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb for ethereum

Decode hex 0x48656c6c6f
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
