# Using Blockchain Features

This guide shows how to use the blockchain-specific features of the MCP Grove server.

## Natural Language Queries

The most powerful feature is `query_blockchain`, which allows you to use natural language:

```
Get the latest height for ethereum
```

This will:
1. Parse "ethereum" from your query
2. Identify "latest height" maps to `eth_blockNumber`
3. Call the Ethereum mainnet RPC endpoint
4. Return the current block height

### More Query Examples

```
Get the latest height for ethereum
Get the current block number for polygon
Check balance for solana
Get the latest block for arbitrum
Fetch block for optimism
```

The query parser understands:
- **Blockchain names**: ethereum, polygon, arbitrum, optimism, base, bsc, avalanche, solana
- **Common aliases**: eth, matic, arb, op, avax, sol, bnb
- **Action phrases**: "latest height", "current height", "block number", "get balance", "get block"

## Direct RPC Method Calls

For more control, use `call_rpc_method`:

### Get Latest Block Number (Ethereum)

```json
{
  "blockchain": "ethereum",
  "method": "eth_blockNumber",
  "params": []
}
```

### Get Block by Number

```json
{
  "blockchain": "ethereum",
  "method": "eth_getBlockByNumber",
  "params": ["latest", false]
}
```

### Get Account Balance

```json
{
  "blockchain": "ethereum",
  "method": "eth_getBalance",
  "params": ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "latest"]
}
```

### Solana Examples

```json
{
  "blockchain": "solana",
  "method": "getBlockHeight",
  "params": []
}
```

```json
{
  "blockchain": "solana",
  "method": "getBalance",
  "params": ["YourPublicKeyHere"]
}
```

## Discovering Available Services

### List All Blockchain Services

```
Use tool: list_blockchain_services
```

Returns all configured blockchain networks with their RPC URLs and supported methods.

### Filter by Category

```json
{
  "category": "evm"
}
```

Categories:
- `evm` - Ethereum-compatible chains (Ethereum, Polygon, BSC, Avalanche)
- `layer2` - Layer 2 solutions (Arbitrum, Optimism, Base)
- `non-evm` - Non-EVM chains (Solana)

### Get Service Details

```json
{
  "blockchain": "ethereum",
  "network": "mainnet"
}
```

Returns complete service info including all supported RPC methods.

### Get Supported Methods

```json
{
  "blockchain": "ethereum"
}
```

Returns an array of all RPC methods available for that blockchain.

## Available Blockchains

### EVM Chains (Mainnet)
- **Ethereum**: `ethereum`
- **Polygon**: `polygon`
- **Binance Smart Chain**: `bsc`
- **Avalanche C-Chain**: `avalanche`

### Layer 2 Chains
- **Arbitrum One**: `arbitrum`
- **Optimism**: `optimism`
- **Base**: `base`

### Non-EVM Chains
- **Solana**: `solana`

### Testnets
- **Ethereum Sepolia**: `ethereum` (network: `testnet`)
- All mainnets also have testnet equivalents

## Common RPC Methods

### Ethereum-Compatible Chains

All EVM chains support these methods:

- `eth_blockNumber` - Get latest block number
- `eth_getBlockByNumber` - Get block by number
- `eth_getBlockByHash` - Get block by hash
- `eth_getBalance` - Get account balance
- `eth_call` - Execute a read-only contract call
- `eth_sendRawTransaction` - Send a signed transaction
- `eth_getLogs` - Get event logs
- `eth_getTransactionReceipt` - Get transaction receipt
- `eth_getTransactionByHash` - Get transaction by hash
- `eth_estimateGas` - Estimate gas for a transaction

### Solana Methods

- `getBlockHeight` - Get current block height
- `getBalance` - Get account balance
- `getBlock` - Get block information
- `getTransaction` - Get transaction details
- `getAccountInfo` - Get account information

## Example Workflows

### 1. Monitor Latest Block

```javascript
// Get latest block number
{
  "blockchain": "ethereum",
  "method": "eth_blockNumber",
  "params": []
}

// Get full block details
{
  "blockchain": "ethereum",
  "method": "eth_getBlockByNumber",
  "params": ["latest", true]  // true = include full transactions
}
```

### 2. Check Account Balance

```javascript
{
  "blockchain": "ethereum",
  "method": "eth_getBalance",
  "params": [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "latest"
  ]
}
```

Result is in Wei (1 ETH = 10^18 Wei).

### 3. Query Smart Contract

```javascript
{
  "blockchain": "ethereum",
  "method": "eth_call",
  "params": [
    {
      "to": "0x...",  // Contract address
      "data": "0x..."  // Encoded function call
    },
    "latest"
  ]
}
```

### 4. Get Transaction Receipt

```javascript
{
  "blockchain": "ethereum",
  "method": "eth_getTransactionReceipt",
  "params": ["0x..."]  // Transaction hash
}
```

### 5. Cross-Chain Comparison

```javascript
// Compare block heights across chains
// 1. Ethereum
query_blockchain("get latest height for ethereum")

// 2. Polygon
query_blockchain("get latest height for polygon")

// 3. Arbitrum
query_blockchain("get latest height for arbitrum")
```

## Working with Testnets

Specify `network: "testnet"` to use testnet endpoints:

```json
{
  "blockchain": "ethereum",
  "network": "testnet",
  "method": "eth_blockNumber",
  "params": []
}
```

## Response Format

All RPC calls return a standardized response:

```json
{
  "success": true,
  "data": "0x...",  // The actual RPC result
  "metadata": {
    "timestamp": "2025-10-03T...",
    "endpoint": "https://eth.rpc.grove.city/v1/01fdb492"
  }
}
```

On error:

```json
{
  "success": false,
  "error": "Error message",
  "data": {
    "code": -32600,
    "message": "Invalid request"
  },
  "metadata": {
    "timestamp": "2025-10-03T...",
    "endpoint": "https://eth.rpc.grove.city/v1/01fdb492"
  }
}
```

## Adding New Blockchains

To add support for a new blockchain:

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

3. Add aliases to `methodAliases` for natural language queries
4. Rebuild: `npm run build`

## Tips

1. **Use natural language queries** for quick exploration
2. **Use direct RPC calls** when you need precise control over parameters
3. **Check supported methods** first if you're unsure what's available
4. **All responses include metadata** showing which endpoint was called
5. **Testnet endpoints use the same methods** as mainnet
