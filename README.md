<div align="center">
  <img src="https://storage.googleapis.com/grove-brand-assets/Presskit/Logo%20Joined-2.png" alt="Grove Logo" width="400"/>
</div>

<div align="center">
  <img src="./mcp.png" alt="MCP" width="300"/>
</div>

<div align="center">

![Maintained by Grove](https://img.shields.io/badge/Maintained_by-Grove-green)
![GitHub Issues](https://img.shields.io/github/issues/buildwithgrove/mcp-grove)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/buildwithgrove/mcp-grove)

</div>

# Grove MCP Server

**Model Context Protocol (MCP)** server for blockchain data access across **[70+ networks](https://grove.city/services)** via Grove's public endpoints.

Not a standalone CLI — **requires an MCP client** such as Claude Desktop, Claude Code CLI, or MCP Inspector.

Turn Claude into a blockchain analysis tool with natural language queries, token analytics, transaction inspection, domain resolution, and multi-chain comparisons.

> **Free Public Access**: Uses Grove's free public RPC endpoints by default (may be rate limited). See https://grove.city/public-endpoints. For higher rate limits, set `GROVE_APP_ID` (get it at [portal.grove.city](https://portal.grove.city)).

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Detailed Installation](#detailed-installation)
- [Available Tools](#available-tools)
  - [Core Blockchain Tools](#core-blockchain-tools-5-tools)
  - [Domain Resolution](#domain-resolution-3-tools)
  - [Transaction & Block Tools](#transaction--block-tools-5-tools)
  - [Token Tools](#token-tools-2-tools)
  - [Multi-Chain & Historical Analysis](#multi-chain--historical-analysis-3-tools)
  - [Smart Contract Tools](#smart-contract-tools-1-tool)
  - [Utility Tools](#utility-tools-3-tools)
  - [Endpoint Management](#endpoint-management-5-tools)
  - [Solana Tools](#solana-tools-11-tools)
  - [Sui Tools](#sui-tools-11-tools)
  - [Cosmos SDK Tools](#cosmos-sdk-tools)
  - [Documentation](#documentation-3-tools)
- [Extending with New Blockchains](#extending-with-new-blockchains)
- [Architecture](#architecture)
- [Development](#development)
- [Supported Blockchains](#supported-blockchains)
- [Example Usage](#example-usage)
- [License](#license)

## Quick Start

Prerequisites: Node.js 18+ and npm

1. **Install and build:**
   ```bash
   npm install
   npm run build
   ```

2. **Optional: Set `GROVE_APP_ID`** (for higher rate limits):
   ```bash
   export GROVE_APP_ID=your_app_id
   ```
   Default uses public endpoints (may be rate limited). Get it at [portal.grove.city](https://portal.grove.city).

3. **Configure MCP client:**

   **Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
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

   **Claude Code CLI:**
   ```bash
   claude mcp add grove node /absolute/path/to/mcp-grove/dist/index.js
   ```

   **MCP Inspector** (testing):
   ```bash
   npx @modelcontextprotocol/inspector node dist/index.js
   ```

4. **Restart client** and start querying:
   ```
   "Get the balance of vitalik.eth"
   "Compare balances for 0x... across all EVM chains"
   "What's the current gas price on Ethereum?"
   ```

## Features

### Core Blockchain Access
- **70+ Networks**: Ethereum, Polygon, Arbitrum, Optimism, Base, Solana, NEAR, Sui, and more
- **Natural Language Queries**: "get the latest height for ethereum" → direct results
- **Free Public Access**: No API keys required (may be rate limited)
- **Optional Rate Limit Bypass**: Set `GROVE_APP_ID` for higher limits
- **Live JSON-RPC**: Execute any blockchain RPC method directly

**Tip**: Set `GROVE_APP_ID` once; it applies to all chains (EVM, Solana, Cosmos, Sui).

### Chain-Specific Features

**EVM Chains:**
- Domain Resolution: ENS (.eth) ↔ addresses, Unstoppable Domains (.crypto, .nft, etc.)
- Transaction Analysis: Full details, receipts, gas estimates
- Token Operations: ERC-20 balances, metadata (name, symbol, decimals, supply)
- Multi-Chain Analysis: Compare balances across all EVM chains
- Block Exploration: Detailed block data, event log searches
- Smart Contracts: Read-only contract calls
- Historical Queries: Balance checks at any block height
- Utilities: Unit conversion (wei/gwei/eth), address validation, hex decoding

**Solana:**
- SPL Tokens: Balances and metadata
- Transactions: Full details with compute units and fees
- Priority Fees: Real-time fee estimation
- Account Data: Program accounts, executable status, data owner

**Sui:**
- Balances & Coins: SUI balance, all coin balances, pagination
- Objects: Details, owned objects, type/content display
- Transactions: Blocks, queries, events
- Gas: Reference price, checkpoints

**Cosmos SDK:**
- Multi-Denom Balances: Native tokens and IBC assets
- Staking: Delegations, validators, rewards
- Governance: Proposals, votes
- IBC Support: Cross-chain queries via REST API

## Detailed Installation

See [CLAUDE_DESKTOP_SETUP.md](CLAUDE_DESKTOP_SETUP.md) for complete setup instructions.

### Manual Setup

```bash
# Clone and build
git clone https://github.com/buildwithgrove/mcp-grove.git
cd mcp-grove
npm install
npm run build

# Configure MCP client (see Quick Start section above)
# Restart client when done
```

## Available Tools

40+ specialized tools for blockchain analysis across EVM, Solana, and Cosmos chains:

### Core Blockchain Tools (5 tools)

- `query_blockchain` - Natural language queries (e.g., "get the latest height for ethereum")
- `list_blockchain_services` - List all [70+ available networks](https://grove.city/services)
- `get_blockchain_service` - Get blockchain details and supported methods
- `call_rpc_method` - Call any JSON-RPC method directly
- `get_supported_methods` - Get all available RPC methods for a blockchain

### Domain Resolution (3 tools)

- `resolve_domain` - Resolve ENS (.eth) or Unstoppable Domains (.crypto, .nft, etc.)
- `reverse_resolve_domain` - Reverse resolve Ethereum address to ENS name
- `get_domain_records` - Get ENS text records (avatar, email, url, twitter, github, etc.)

### Transaction & Block Tools (5 tools)

- `get_transaction` - Get transaction details by hash
- `get_transaction_receipt` - Get receipt with status, gas used, logs, events
- `estimate_gas` - Estimate gas required for a transaction
- `get_block_details` - Get block information with optional full transaction list
- `search_logs` - Search event logs by address, topics, block range

### Token Tools (2 tools)

- `get_token_balance` - Get ERC-20 token balance
- `get_token_metadata` - Get token name, symbol, decimals, total supply

### Multi-Chain & Historical Analysis (3 tools)

- `compare_balances` - Compare native balance across all EVM chains
- `get_historical_balance` - Get balance at specific block height
- `get_gas_price` - Get current gas price with gwei/eth conversion

### Smart Contract Tools (1 tool)

- `call_contract_view` - Execute read-only contract functions

### Utility Tools (3 tools)

- `convert_units` - Convert between wei, gwei, and eth
- `validate_address` - Validate address format (EVM/Solana/Cosmos)
- `decode_hex` - Decode hex strings to UTF-8, ASCII, byte arrays

### Endpoint Management (5 tools)

- `list_endpoints` - List all endpoints (filter by category)
- `get_endpoint_details` - Get endpoint details
- `call_endpoint` - Execute endpoint with custom parameters
- `list_categories` - List endpoint categories
- `add_endpoint` - Add new endpoints at runtime

### Solana Tools (11 tools)

**SPL Tokens:**
- `get_solana_token_balance` - Get SPL token balance(s)
- `get_solana_token_metadata` - Get token decimals, supply, authorities

**Accounts & Balances:**
- `get_solana_balance` - Get SOL balance with lamports/SOL conversion
- `get_solana_account_info` - Get account data, owner, executable status

**Blocks & Transactions:**
- `get_solana_block` - Get block with optional full transaction list
- `get_solana_transaction` - Get transaction details by signature
- `get_solana_signatures` - Get transaction history

**Fees:**
- `get_solana_prioritization_fees` - Get recent priority fees
- `get_solana_fee_for_message` - Estimate fee for serialized message

**Network & Programs:**
- `get_solana_block_height` - Get current block height
- `get_solana_program_accounts` - List accounts owned by program

### Sui Tools (11 tools)

**Balances & Coins:**
- `get_sui_balance` - Get SUI balance
- `get_sui_all_balances` - Get all coin balances
- `get_sui_coins` - Paginate coins by type

**Objects:**
- `get_sui_object` - Get object details
- `get_sui_owned_objects` - List owned objects

**Transactions:**
- `get_sui_transaction` - Get transaction block by digest
- `query_sui_transactions` - Query transactions with filters

**Events & Chain:**
- `query_sui_events` - Query events with filters
- `get_sui_latest_checkpoint` - Get latest checkpoint
- `get_sui_checkpoint` - Get checkpoint by ID

### Cosmos SDK Tools

**Accounts & Balances:**
- `get_cosmos_balance` - Get balance for denom
- `get_cosmos_all_balances` - Get all token balances
- `get_cosmos_account` - Get account info (sequence, number)

**Staking:**
- `get_cosmos_delegations` - Get delegations
- `get_cosmos_validators` - List validators
- `get_cosmos_validator` - Get validator details
- `get_cosmos_rewards` - Get staking rewards

**Transactions:**
- `get_cosmos_transaction` - Get transaction by hash
- `search_cosmos_transactions` - Search transactions by events

**Governance:**
- `get_cosmos_proposals` - Get proposals (filter by status)
- `get_cosmos_proposal` - Get proposal details
- `get_cosmos_proposal_votes` - Get votes for proposal

**Blocks:**
- `get_cosmos_latest_block` - Get latest block
- `get_cosmos_block` - Get block at height

**Chain Info:**
- `get_cosmos_params` - Get chain parameters

### Documentation (3 tools)

- `get_doc_page` - Get documentation pages from docs.grove.city
- `get_endpoint_docs` - Get endpoint documentation
- `search_docs` - Search Grove documentation

## Extending with New Blockchains

Add new blockchain networks by editing `src/config/blockchain-services.json`:

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

Then rebuild (`npm run build`) and restart your MCP client.

See [EXTENDING.md](EXTENDING.md) for details.

## Architecture

```
src/
├── index.ts                            # MCP server entry point (40+ tools)
├── types.ts                            # TypeScript type definitions
├── config/
│   ├── blockchain-services.json        # 70 blockchain network configurations
│   └── endpoints.json                  # HTTP endpoint configurations
├── handlers/                            # Tool handlers organized by feature
│   ├── blockchain-handlers.ts          # Core blockchain tools
│   ├── domain-handlers.ts              # ENS & domain resolution
│   ├── transaction-handlers.ts         # Transaction & block tools
│   ├── token-handlers.ts               # ERC-20 token tools
│   ├── multichain-handlers.ts          # Multi-chain comparison
│   ├── contract-handlers.ts            # Smart contract interactions
│   ├── utility-handlers.ts             # Conversion & validation utilities
│   ├── endpoint-handlers.ts            # HTTP endpoint management
│   ├── solana-handlers.ts              # Solana-specific tools
│   ├── cosmos-handlers.ts              # Cosmos SDK tools
│   ├── sui-handlers.ts                 # Sui blockchain tools
│   └── docs-handlers.ts                # Documentation tools
└── services/
    ├── blockchain-service.ts           # Core RPC calls & natural language queries
    ├── advanced-blockchain-service.ts  # EVM: Transactions, tokens, blocks, utilities
    ├── solana-service.ts               # Solana: SPL tokens, accounts, transactions, fees
    ├── sui-service.ts                  # Sui: balances, coins, objects, transactions, checkpoints
    ├── cosmos-service.ts               # Cosmos SDK: Staking, governance, IBC
    ├── domain-resolver.ts              # ENS & Unstoppable Domains resolution
    ├── endpoint-manager.ts             # Generic HTTP endpoint manager
    └── docs-manager.ts                 # Documentation retrieval
```

## Development

**Build:**
```bash
npm run build
```

**Watch mode:**
```bash
npm run watch
```

**Tests:**
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

**Smoke tests** (end-to-end test across chain types):
```bash
npm run build
npm run smoke
```

Tests EVM (Ethereum, Polygon, Base), Solana, Sui, Cosmos (Osmosis, Persistence), and Radix.

## Supported Blockchains

[70 blockchain networks](https://grove.city/services) available via Grove's public endpoints:

**EVM Chains:**
Ethereum, Polygon, BSC, Avalanche, Gnosis, Celo, Fantom, Harmony, Moonbeam, Moonriver, Fuse, IoTeX, Oasys, Kaia, Berachain, Sonic, Ink, XRPL EVM

**Layer 2 Solutions:**
Arbitrum, Optimism, Base, zkSync Era, zkLink Nova, Scroll, Linea, Mantle, Blast, Boba, Metis, Taiko, Unichain, opBNB, Fraxtal, Polygon zkEVM

**Cosmos Ecosystem:**
Osmosis, Juno, Akash, Kava, Persistence, Stargaze, AtomOne, Cheqd, Chihuahua, Fetch.ai, Hyperliquid, Jackal, Pocket Network, Seda, Sei, Shentu

**Non-EVM:**
Solana, NEAR, Sui, Tron, Radix

**Testnets:**
Ethereum, Polygon, Arbitrum, Optimism, Base, Taiko, XRPL EVM, Giwa

Most chains use public endpoint ID `01fdb492`. Foundation-sponsored endpoints (Kaia, XRPL EVM, Radix) offer better performance and are automatically preferred.

## Example Usage

### Blockchain Queries
```
Get the latest height for ethereum
List all available blockchain services
Show me supported methods for solana
Call eth_getBalance on ethereum for address 0x...
```

### Domain Resolution
```
Resolve vitalik.eth
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

### Solana
```
Get SOL balance for address ABC123...
Get all SPL token balances for wallet DEF456...
Get USDC balance for Solana wallet (mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
Get transaction details for signature 5a1b2c3d...
Get recent prioritization fees for Solana
```

### Cosmos Ecosystem
```
Get OSMO balance for osmo1abc... on osmosis
Get all delegations for osmo1abc... on osmosis
Get list of validators on juno
Get staking rewards for akash1xyz... on akash
Get governance proposals on osmosis
Search transactions by event on kava
```

### Using `GROVE_APP_ID`
Bypass rate limits by setting an environment variable:
```
export GROVE_APP_ID=your_id_from_portal
```
The MCP server will automatically use `GROVE_APP_ID` for all requests. Get it at [portal.grove.city](https://portal.grove.city).

### Documentation
```
Show me all available Grove endpoints
Search the Grove documentation for "authentication"
Get the public endpoints page
```

See [BLOCKCHAIN_USAGE.md](BLOCKCHAIN_USAGE.md) for more examples.

## License

MIT
