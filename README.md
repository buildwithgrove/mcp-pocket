# Grove MCP Server

A comprehensive **Model Context Protocol (MCP)** server providing blockchain data access across **69+ networks** via Grove's public endpoints for Pocket Network.

Transform Claude into a powerful blockchain analysis tool with natural language queries, token analytics, transaction inspection, domain resolution, and multi-chain comparisons - all through Grove's free public RPC infrastructure.

> **💡 Free Public Access + Optional Rate Limit Bypass**: Uses Grove's free public RPC endpoints by default - no API keys required! For higher rate limits, optionally provide your Grove Portal appId from [portal.grove.city](https://portal.grove.city).

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   npm run build
   ```

2. **Add to Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
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

3. **Restart Claude Desktop** and start querying blockchains:
   ```
   "Get the balance of vitalik.eth"
   "Compare balances for 0x... across all EVM chains"
   "What's the current gas price on Ethereum?"
   ```

## Features

### Core Blockchain Access
- **69+ Networks**: Ethereum, Polygon, Arbitrum, Optimism, Base, Solana, NEAR, Sui, and 60+ more
- **Natural Language Queries**: "get the latest height for ethereum" → direct results
- **Free Public Access**: No API keys required - uses Grove's public RPC endpoints
- **Optional Rate Limit Bypass**: Add Grove Portal appId for unlimited requests
- **Live JSON-RPC**: Execute any blockchain RPC method directly

### Advanced Features
- **🔍 Domain Resolution**: ENS (.eth) ↔ addresses, Unstoppable Domains (.crypto, .nft, etc.)
- **📊 Transaction Analysis**: Full transaction details, receipts, gas estimates
- **💰 Token Operations**: ERC-20 balances, metadata (name, symbol, decimals, supply)
- **⛓️ Multi-Chain Analysis**: Compare balances across ALL EVM chains in one query
- **📦 Block Exploration**: Detailed block data, event log searches
- **📜 Smart Contracts**: Read-only contract calls
- **⏰ Historical Queries**: Time-travel balance checks at any block height
- **🛠️ Utilities**: Unit conversion (wei/gwei/eth), address validation, hex decoding

## Detailed Installation

For detailed setup instructions, see [CLAUDE_DESKTOP_SETUP.md](CLAUDE_DESKTOP_SETUP.md).

### Manual Setup

```bash
# Clone and build
git clone https://github.com/buildwithgrove/mcp-grove.git
cd mcp-grove
npm install
npm run build

# Add to Claude Desktop config: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "grove": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-grove/dist/index.js"]
    }
  }
}

# Restart Claude Desktop
```

## Available Tools

**24 specialized tools** for comprehensive blockchain analysis:

### Core Blockchain Tools (5 tools)

- `query_blockchain` - **Natural language queries** (e.g., "get the latest height for ethereum")
- `list_blockchain_services` - List all 69+ available blockchain networks
- `get_blockchain_service` - Get details about a specific blockchain including supported methods
- `call_rpc_method` - Call any JSON-RPC method directly on any blockchain
- `get_supported_methods` - Get all available RPC methods for a blockchain

### Domain Resolution (3 tools)

- `resolve_domain` - Resolve ENS (.eth) or Unstoppable Domains (.crypto, .nft, etc.) to addresses
- `reverse_resolve_domain` - Reverse resolve Ethereum address to ENS domain name
- `get_domain_records` - Get ENS text records (avatar, email, url, twitter, github, etc.)

### Transaction & Block Tools (5 tools)

- `get_transaction` - Get transaction details by hash across any chain
- `get_transaction_receipt` - Get receipt with status, gas used, logs, and events
- `estimate_gas` - Estimate gas required for a transaction before sending
- `get_block_details` - Get detailed block information with optional full transaction list
- `search_logs` - Search and filter event logs by address, topics, and block range

### Token Tools (2 tools)

- `get_token_balance` - Get ERC-20 token balance for any address
- `get_token_metadata` - Get token name, symbol, decimals, and total supply

### Multi-Chain & Historical Analysis (3 tools)

- `compare_balances` - Compare native token balance across ALL EVM chains simultaneously
- `get_historical_balance` - Get balance at a specific block height (time-travel queries)
- `get_gas_price` - Get current gas price with automatic gwei/eth conversion

### Smart Contract Tools (1 tool)

- `call_contract_view` - Execute read-only contract functions with encoded calldata

### Utility Tools (3 tools)

- `convert_units` - Convert between wei, gwei, and eth with exact precision
- `validate_address` - Validate address format for specific blockchain (EVM/Solana/Cosmos)
- `decode_hex` - Decode hex strings to UTF-8, ASCII, and byte arrays

### Endpoint Management (5 tools)

- `list_endpoints` - List all available endpoints (filter by category)
- `get_endpoint_details` - Get detailed info about a specific endpoint
- `call_endpoint` - Execute an endpoint with custom parameters
- `list_categories` - List all available endpoint categories
- `add_endpoint` - Dynamically add new endpoints at runtime

### Documentation (3 tools)

- `get_doc_page` - Retrieve specific documentation pages from docs.grove.city
- `get_endpoint_docs` - Get documentation for a specific endpoint
- `search_docs` - Full-text search across Grove documentation

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
├── index.ts                            # MCP server entry point
├── types.ts                            # TypeScript type definitions
├── config/
│   ├── blockchain-services.json        # 69+ blockchain network configurations
│   └── endpoints.json                  # HTTP endpoint configurations
└── services/
    ├── blockchain-service.ts           # Core RPC calls & natural language queries
    ├── advanced-blockchain-service.ts  # Transactions, tokens, blocks, utilities
    ├── domain-resolver.ts              # ENS & Unstoppable Domains resolution
    ├── endpoint-manager.ts             # Generic HTTP endpoint manager
    └── docs-manager.ts                 # Documentation retrieval
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
