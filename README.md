# Grove MCP Server

A comprehensive **Model Context Protocol (MCP)** server providing blockchain data access across **[69+ networks](https://grove.city/services)** via Grove's public endpoints for Pocket Network.

Transform Claude into a powerful blockchain analysis tool with natural language queries, token analytics, transaction inspection, domain resolution, and multi-chain comparisons - all through Grove's free public RPC infrastructure.

> **💡 Free Public Access + Optional Rate Limit Bypass**: Uses Grove's free public RPC endpoints by default — no API keys required (may be rate limited). See the list at https://grove.city/public-endpoints. For higher rate limits, optionally provide your Grove Portal appId from [portal.grove.city](https://portal.grove.city).

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   npm run build
   ```

2. **Public endpoints by default (rate limited) + optional appId**
   - By default this server uses Grove's public endpoints (may be rate limited). See the list at https://grove.city/public-endpoints.
   - For higher rate limits across all chains, optionally set your Grove Portal appId (same appId works everywhere):
     ```bash
     export GROVE_APP_ID=your_app_id
     ```

3. **Add to Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
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

4. **Restart Claude Desktop** and start querying blockchains:
   ```
   "Get the balance of vitalik.eth"
   "Compare balances for 0x... across all EVM chains"
   "What's the current gas price on Ethereum?"
   ```

## Features

### Core Blockchain Access
- **69+ Networks**: Ethereum, Polygon, Arbitrum, Optimism, Base, Solana, NEAR, Sui, and 60+ more
- **Natural Language Queries**: "get the latest height for ethereum" → direct results
- **Free Public Access**: No API keys required — uses Grove's public RPC endpoints (may be rate limited; see https://grove.city/public-endpoints)
- **Optional Rate Limit Bypass**: Add Grove Portal appId for unlimited requests
- **Live JSON-RPC**: Execute any blockchain RPC method directly

Tip: Set `GROVE_APP_ID` once and it applies to all chains (EVM, Solana, Cosmos, Sui). You can also pass `appId` per-tool if you prefer.

### Advanced Features

**EVM Chains:**
- **🔍 Domain Resolution**: ENS (.eth) ↔ addresses, Unstoppable Domains (.crypto, .nft, etc.)
- **📊 Transaction Analysis**: Full transaction details, receipts, gas estimates
- **💰 Token Operations**: ERC-20 balances, metadata (name, symbol, decimals, supply)
- **⛓️ Multi-Chain Analysis**: Compare balances across ALL EVM chains in one query
- **📦 Block Exploration**: Detailed block data, event log searches
- **📜 Smart Contracts**: Read-only contract calls
- **⏰ Historical Queries**: Time-travel balance checks at any block height
- **🛠️ Utilities**: Unit conversion (wei/gwei/eth), address validation, hex decoding

**Solana:**
- **🪙 SPL Tokens**: Token balances and metadata for any SPL token
- **💸 Transactions**: Full transaction details with compute units and fees
- **📊 Priority Fees**: Real-time fee estimation for optimal transaction pricing
- **📜 Account Data**: Program accounts, executable status, data owner

**Sui:**
- **🪙 Balances & Coins**: SUI balance, all coin balances, coin pagination
- **📦 Objects**: Object details, owned objects, type/content display
- **💸 Transactions**: Transaction blocks, queries, events
- **⛽ Gas**: Reference gas price, latest checkpoint, checkpoint details

**Cosmos SDK:**
- **🏦 Multi-Denom Balances**: Native tokens and IBC assets
- **🔒 Staking**: Delegations, validators, rewards across all chains
- **🗳️ Governance**: Proposals, votes, and on-chain governance
- **🔗 IBC Support**: Cross-chain balance queries via REST API

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

**40+ specialized tools** for comprehensive blockchain analysis across EVM, Solana, and Cosmos chains:

### Core Blockchain Tools (5 tools)

- `query_blockchain` - **Natural language queries** (e.g., "get the latest height for ethereum")
- `list_blockchain_services` - List all [69+ available networks](https://grove.city/services)
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

### Solana Tools (11 tools)

**SPL Tokens:**
- `get_solana_token_balance` - Get SPL token balance(s) for a Solana wallet
- `get_solana_token_metadata` - Get token decimals, supply, mint/freeze authorities

**Accounts & Balances:**
- `get_solana_balance` - Get SOL balance with lamports and SOL conversion
- `get_solana_account_info` - Get account data, owner, and executable status

**Blocks & Transactions:**
- `get_solana_block` - Get block information with optional full transaction list
- `get_solana_transaction` - Get transaction details by signature with full metadata
- `get_solana_signatures` - Get transaction history for an address

**Fees:**
- `get_solana_prioritization_fees` - Get recent priority fees for transaction optimization
- `get_solana_fee_for_message` - Estimate fee for a serialized message (base64)

**Network & Programs:**
- `get_solana_block_height` - Get current block height
- `get_solana_program_accounts` - List accounts owned by a program (with filters)

### Sui Tools (11 tools)

**Balances & Coins:**
- `get_sui_balance` - Get SUI balance with SUI conversion
- `get_sui_all_balances` - Get all coin balances for an address
- `get_sui_coins` - Paginate coins by `coinType` with cursor/limit

**Objects:**
- `get_sui_object` - Get object details with display/content options
- `get_sui_owned_objects` - List objects owned by an address with filters

**Transactions:**
- `get_sui_transaction` - Get transaction block details by digest
- `query_sui_transactions` - Query transactions with filters and pagination

**Events & Chain:**
- `query_sui_events` - Query events with filters and sort order
- `get_sui_latest_checkpoint` - Get the latest checkpoint sequence number
- `get_sui_checkpoint` - Get checkpoint details by ID

### Cosmos SDK Tools

**Accounts & Balances:**
- `get_cosmos_balance` - Get balance for specific denom or all balances
- `get_cosmos_all_balances` - Get all token balances for an address
- `get_cosmos_account` - Get account information (sequence, account number)

**Staking:**
- `get_cosmos_delegations` - Get all delegations (staked tokens) for an address
- `get_cosmos_validators` - List validators (bonded, unbonded, unbonding, or all)
- `get_cosmos_validator` - Get specific validator details
- `get_cosmos_rewards` - Get staking rewards for a delegator

**Transactions:**
- `get_cosmos_transaction` - Get transaction by hash
- `search_cosmos_transactions` - Search transactions by events

**Governance:**
- `get_cosmos_proposals` - Get governance proposals (filter by status)
- `get_cosmos_proposal` - Get specific proposal details
- `get_cosmos_proposal_votes` - Get all votes for a proposal

**Blocks:**
- `get_cosmos_latest_block` - Get latest block information
- `get_cosmos_block` - Get block at specific height

**Chain Info:**
- `get_cosmos_params` - Get chain parameters (staking, slashing, distribution, gov, mint)

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
├── index.ts                            # MCP server entry point (40+ tools)
├── types.ts                            # TypeScript type definitions
├── config/
│   ├── blockchain-services.json        # 69 blockchain network configurations
│   └── endpoints.json                  # HTTP endpoint configurations
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

Watch mode for development:

```bash
npm run watch
```

### Smoke Test

Run a quick end-to-end test across multiple chain types using public endpoints:

```bash
npm run build
npm run smoke
```

Tests EVM (Ethereum, Polygon, Base), Solana, Sui, Cosmos (Osmosis, Persistence), and Radix chains.

## Supported Blockchains

**[69 blockchain networks](https://grove.city/services)** available via Grove's public endpoints:

**EVM Chains:**
Ethereum, Polygon, BSC, Avalanche, Gnosis, Celo, Fantom, Harmony, Moonbeam, Moonriver, Fuse, IoTeX, Oasys, Kaia, Berachain, Sonic, Ink, XRPL EVM

**Layer 2 Solutions:**
Arbitrum, Optimism, Base, zkSync Era, zkLink Nova, Scroll, Linea, Mantle, Blast, Boba, Metis, Taiko, Unichain, opBNB, Fraxtal, Polygon zkEVM

**Cosmos Ecosystem:** ✅ (many chains supported)
Osmosis, Juno, Akash, Kava, Persistence, Stargaze, AtomOne, Cheqd, Chihuahua, Fetch.ai, Hyperliquid, Jackal, Pocket Network, Seda, Sei, Shentu

**Non-EVM:**
Solana ✅ (full support), NEAR, Sui, Tron, Radix

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

### Solana Operations

```
Get SOL balance for address ABC123...

Get all SPL token balances for wallet DEF456...

Get USDC balance for Solana wallet (mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)

Get transaction details for signature 5a1b2c3d...

Get recent prioritization fees for Solana

Get transaction history for address ABC123...
```

### Cosmos Ecosystem (Osmosis, Juno, Kava, Akash, etc.)

```
Get OSMO balance for osmo1abc... on osmosis

Get all delegations for osmo1abc... on osmosis

Get list of validators on juno

Get staking rewards for akash1xyz... on akash

Get governance proposals on osmosis

Get proposal #123 details on juno

Search transactions by event on kava

Get latest block on persistence
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
