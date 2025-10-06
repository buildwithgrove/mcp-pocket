#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { EndpointManager } from './services/endpoint-manager.js';
import { DocsManager } from './services/docs-manager.js';
import { BlockchainRPCService } from './services/blockchain-service.js';
import { DomainResolverService } from './services/domain-resolver.js';
import { AdvancedBlockchainService } from './services/advanced-blockchain-service.js';
import { SolanaService } from './services/solana-service.js';
import { CosmosService } from './services/cosmos-service.js';
import { SuiService } from './services/sui-service.js';
import { ServerConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration
const configPath = join(__dirname, 'config', 'endpoints.json');
const configData = await readFile(configPath, 'utf-8');
const config: ServerConfig = JSON.parse(configData);

// Load blockchain services
const blockchainConfigPath = join(__dirname, 'config', 'blockchain-services.json');
const blockchainConfigData = await readFile(blockchainConfigPath, 'utf-8');
const blockchainConfig = JSON.parse(blockchainConfigData);

// Initialize managers
const endpointManager = new EndpointManager(config);
const docsManager = new DocsManager(config);
const blockchainService = new BlockchainRPCService(blockchainConfig);
const domainResolver = new DomainResolverService(blockchainService);
const advancedBlockchain = new AdvancedBlockchainService(blockchainService);
const solanaService = new SolanaService(blockchainService);
const cosmosService = new CosmosService(blockchainService);
const suiService = new SuiService(blockchainService);

// Create MCP server
const server = new Server(
  {
    name: 'mcp-grove',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'list_endpoints',
    description: "List all available Grove's public endpoints for Pocket Network, optionally filtered by category",
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional category to filter endpoints',
        },
      },
    },
  },
  {
    name: 'get_endpoint_details',
    description: 'Get detailed information about a specific endpoint',
    inputSchema: {
      type: 'object',
      properties: {
        endpointId: {
          type: 'string',
          description: 'The ID of the endpoint to retrieve',
        },
      },
      required: ['endpointId'],
    },
  },
  {
    name: 'call_endpoint',
    description: "Call a Grove endpoint for Pocket Network with optional parameters",
    inputSchema: {
      type: 'object',
      properties: {
        endpointId: {
          type: 'string',
          description: 'The ID of the endpoint to call',
        },
        pathParams: {
          type: 'object',
          description: 'Path parameters (e.g., {id: "123"} for /users/:id)',
        },
        queryParams: {
          type: 'object',
          description: 'Query parameters to append to the URL',
        },
        body: {
          type: 'object',
          description: 'Request body for POST/PUT/PATCH requests',
        },
      },
      required: ['endpointId'],
    },
  },
  {
    name: 'list_categories',
    description: 'List all available endpoint categories',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_doc_page',
    description: 'Retrieve a documentation page from docs.grove.city',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the documentation page (e.g., "/api/overview")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'get_endpoint_docs',
    description: 'Get documentation for a specific endpoint',
    inputSchema: {
      type: 'object',
      properties: {
        endpointId: {
          type: 'string',
          description: 'The ID of the endpoint',
        },
      },
      required: ['endpointId'],
    },
  },
  {
    name: 'search_docs',
    description: 'Search Grove documentation for a specific query',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        paths: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Optional array of paths to search within',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'add_endpoint',
    description: 'Dynamically add a new endpoint configuration (for extensibility)',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier for the endpoint',
        },
        name: {
          type: 'string',
          description: 'Human-readable name',
        },
        path: {
          type: 'string',
          description: 'URL path (e.g., "/api/users/:id")',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          description: 'HTTP method',
        },
        description: {
          type: 'string',
          description: 'Description of what the endpoint does',
        },
        category: {
          type: 'string',
          description: 'Category for organization',
        },
      },
      required: ['id', 'name', 'path', 'method', 'description', 'category'],
    },
  },
  {
    name: 'list_blockchain_services',
    description: 'List all available blockchain services/networks supported by Grove',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional category filter (e.g., "evm", "layer2", "non-evm")',
        },
      },
    },
  },
  {
    name: 'get_blockchain_service',
    description: 'Get details about a specific blockchain service including supported RPC methods',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name (e.g., "ethereum", "polygon", "solana")',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
      },
      required: ['blockchain'],
    },
  },
  {
    name: 'call_rpc_method',
    description: 'Call a JSON-RPC method on a specific blockchain service',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name (e.g., "ethereum", "polygon")',
        },
        method: {
          type: 'string',
          description: 'RPC method name (e.g., "eth_blockNumber", "eth_getBalance")',
        },
        params: {
          type: 'array',
          description: 'Array of parameters for the RPC method',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId. If not provided, uses public endpoints. Get your appId from portal.grove.city for higher rate limits',
        },
      },
      required: ['blockchain', 'method'],
    },
  },
  {
    name: 'query_blockchain',
    description: 'Execute a natural language query to interact with blockchain data (e.g., "get the latest height for ethereum")',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query describing what you want to do',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_supported_methods',
    description: 'Get all supported RPC methods for a specific blockchain service',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
      },
      required: ['blockchain'],
    },
  },
  {
    name: 'resolve_domain',
    description: 'Resolve a blockchain domain name (ENS .eth or Unstoppable Domains) to an address using Grove endpoints',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'The domain name to resolve (e.g., "vitalik.eth", "alice.crypto")',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'reverse_resolve_domain',
    description: 'Reverse resolve an Ethereum address to its ENS domain name',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Ethereum address to reverse resolve',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_domain_records',
    description: 'Get ENS text records for a domain (e.g., avatar, email, url, twitter, github)',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'ENS domain name',
        },
        keys: {
          type: 'array',
          items: { type: 'string' },
          description: 'Text record keys to fetch (e.g., ["avatar", "email", "url", "com.twitter", "com.github"])',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['domain', 'keys'],
    },
  },
  {
    name: 'get_transaction',
    description: 'Get transaction details by transaction hash',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        txHash: {
          type: 'string',
          description: 'Transaction hash',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'txHash'],
    },
  },
  {
    name: 'get_transaction_receipt',
    description: 'Get transaction receipt with status, gas used, and logs',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        txHash: {
          type: 'string',
          description: 'Transaction hash',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'txHash'],
    },
  },
  {
    name: 'estimate_gas',
    description: 'Estimate gas required for a transaction',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        transaction: {
          type: 'object',
          description: 'Transaction object with from, to, data, value, etc.',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'transaction'],
    },
  },
  {
    name: 'get_token_balance',
    description: 'Get ERC-20 token balance for an address',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        tokenAddress: {
          type: 'string',
          description: 'Token contract address',
        },
        walletAddress: {
          type: 'string',
          description: 'Wallet address to check balance',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'tokenAddress', 'walletAddress'],
    },
  },
  {
    name: 'get_token_metadata',
    description: 'Get token metadata (name, symbol, decimals, total supply)',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        tokenAddress: {
          type: 'string',
          description: 'Token contract address',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'tokenAddress'],
    },
  },
  {
    name: 'get_block_details',
    description: 'Get detailed block information with optional transaction list',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        blockNumber: {
          description: 'Block number (number or "latest", "earliest", "pending")',
        },
        includeTransactions: {
          type: 'boolean',
          description: 'Include full transaction objects (default: false)',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'blockNumber'],
    },
  },
  {
    name: 'search_logs',
    description: 'Search event logs by address and topics',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        filter: {
          type: 'object',
          description: 'Log filter with fromBlock, toBlock, address, topics',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'filter'],
    },
  },
  {
    name: 'compare_balances',
    description: 'Compare native token balance for an address across multiple EVM chains',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Address to check',
        },
        blockchains: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of blockchain names (optional, defaults to all EVM chains)',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_gas_price',
    description: 'Get current gas price for a blockchain',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain'],
    },
  },
  {
    name: 'convert_units',
    description: 'Convert between wei, gwei, and eth units',
    inputSchema: {
      type: 'object',
      properties: {
        value: {
          type: 'string',
          description: 'Value to convert',
        },
        fromUnit: {
          type: 'string',
          enum: ['wei', 'gwei', 'eth'],
          description: 'Source unit',
        },
        toUnit: {
          type: 'string',
          enum: ['wei', 'gwei', 'eth'],
          description: 'Target unit',
        },
      },
      required: ['value', 'fromUnit', 'toUnit'],
    },
  },
  {
    name: 'validate_address',
    description: 'Validate address format for a specific blockchain',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Address to validate',
        },
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
      },
      required: ['address', 'blockchain'],
    },
  },
  {
    name: 'decode_hex',
    description: 'Decode hex string to UTF-8, ASCII, and bytes',
    inputSchema: {
      type: 'object',
      properties: {
        hex: {
          type: 'string',
          description: 'Hex string to decode',
        },
      },
      required: ['hex'],
    },
  },
  {
    name: 'call_contract_view',
    description: 'Call a read-only contract function',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        contractAddress: {
          type: 'string',
          description: 'Contract address',
        },
        data: {
          type: 'string',
          description: 'Encoded function call data',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'contractAddress', 'data'],
    },
  },
  {
    name: 'get_historical_balance',
    description: 'Get balance at a specific block height',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        address: {
          type: 'string',
          description: 'Address to check',
        },
        blockNumber: {
          description: 'Block number',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'address', 'blockNumber'],
    },
  },
  {
    name: 'get_solana_token_balance',
    description: 'Get SPL token balance(s) for a Solana wallet',
    inputSchema: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'Solana wallet address',
        },
        mintAddress: {
          type: 'string',
          description: 'Optional: SPL token mint address (if not provided, returns all token balances)',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['walletAddress'],
    },
  },
  {
    name: 'get_solana_token_metadata',
    description: 'Get SPL token metadata (decimals, supply, authorities)',
    inputSchema: {
      type: 'object',
      properties: {
        mintAddress: {
          type: 'string',
          description: 'SPL token mint address',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['mintAddress'],
    },
  },
  {
    name: 'get_solana_balance',
    description: 'Get SOL balance for a Solana address',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Solana address',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_solana_account_info',
    description: 'Get Solana account information',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Solana address',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_solana_block',
    description: 'Get Solana block information with optional transactions',
    inputSchema: {
      type: 'object',
      properties: {
        slot: {
          type: 'number',
          description: 'Block slot number',
        },
        includeTransactions: {
          type: 'boolean',
          description: 'Include full transaction details (default: false)',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['slot'],
    },
  },
  {
    name: 'get_solana_transaction',
    description: 'Get Solana transaction details by signature',
    inputSchema: {
      type: 'object',
      properties: {
        signature: {
          type: 'string',
          description: 'Transaction signature',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['signature'],
    },
  },
  {
    name: 'get_solana_prioritization_fees',
    description: 'Get recent prioritization fees for Solana transactions',
    inputSchema: {
      type: 'object',
      properties: {
        addresses: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: Account addresses to get fees for',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
    },
  },
  {
    name: 'get_solana_block_height',
    description: 'Get the latest Solana block height',
    inputSchema: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
    },
  },
  {
    name: 'get_solana_fee_for_message',
    description: 'Estimate fee for a serialized Solana message (base64)',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Serialized message in base64',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'get_solana_program_accounts',
    description: 'Get accounts owned by a Solana program with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'string',
          description: 'Program ID (public key)',
        },
        filters: {
          type: 'array',
          description: 'Optional RPC filters (memcmp, dataSize, etc.)',
          items: { type: 'object' },
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['programId'],
    },
  },
  // Cosmos SDK Tools (16 tools)
  {
    name: 'get_solana_signatures',
    description: 'Get transaction signatures for a Solana address (transaction history)',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Solana address',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of signatures to return (default: 10)',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['address'],
    },
  },
  // Cosmos SDK Tools (16 tools)
  {
    name: 'get_cosmos_balance',
    description: 'Get balance for a Cosmos SDK address on any Cosmos chain',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name (e.g., "osmosis", "juno", "kava", "akash")',
        },
        address: {
          type: 'string',
          description: 'Cosmos address',
        },
        denom: {
          type: 'string',
          description: 'Optional: Specific denomination to query (e.g., "uosmo", "ujuno")',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'address'],
    },
  },
  {
    name: 'get_cosmos_all_balances',
    description: 'Get all token balances for a Cosmos SDK address',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name (e.g., "osmosis", "juno", "kava")',
        },
        address: {
          type: 'string',
          description: 'Cosmos address',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'address'],
    },
  },
  {
    name: 'get_cosmos_account',
    description: 'Get Cosmos account information (sequence, account number)',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        address: {
          type: 'string',
          description: 'Cosmos address',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'address'],
    },
  },
  {
    name: 'get_cosmos_delegations',
    description: 'Get all staking delegations for a Cosmos address',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        delegatorAddress: {
          type: 'string',
          description: 'Delegator address',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'delegatorAddress'],
    },
  },
  {
    name: 'get_cosmos_validators',
    description: 'Get list of validators on a Cosmos chain',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        status: {
          type: 'string',
          enum: ['bonded', 'unbonded', 'unbonding', 'all'],
          description: 'Validator status filter (defaults to bonded)',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain'],
    },
  },
  {
    name: 'get_cosmos_validator',
    description: 'Get specific validator details',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        validatorAddress: {
          type: 'string',
          description: 'Validator address',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'validatorAddress'],
    },
  },
  {
    name: 'get_cosmos_rewards',
    description: 'Get staking rewards for a delegator',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        delegatorAddress: {
          type: 'string',
          description: 'Delegator address',
        },
        validatorAddress: {
          type: 'string',
          description: 'Optional: Specific validator address',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'delegatorAddress'],
    },
  },
  {
    name: 'get_cosmos_transaction',
    description: 'Get Cosmos transaction by hash',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        txHash: {
          type: 'string',
          description: 'Transaction hash',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'txHash'],
    },
  },
  {
    name: 'search_cosmos_transactions',
    description: 'Search Cosmos transactions by events',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        events: {
          type: 'array',
          items: { type: 'string' },
          description: 'Event filters (e.g., ["message.sender=cosmos1...", "transfer.amount=1000uosmo"])',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'events'],
    },
  },
  {
    name: 'get_cosmos_proposals',
    description: 'Get governance proposals on a Cosmos chain',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        status: {
          type: 'string',
          enum: ['deposit_period', 'voting_period', 'passed', 'rejected', 'failed'],
          description: 'Optional: Filter by proposal status',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain'],
    },
  },
  {
    name: 'get_cosmos_proposal',
    description: 'Get specific governance proposal details',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        proposalId: {
          type: 'number',
          description: 'Proposal ID',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'proposalId'],
    },
  },
  {
    name: 'get_cosmos_proposal_votes',
    description: 'Get all votes for a governance proposal',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        proposalId: {
          type: 'number',
          description: 'Proposal ID',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'proposalId'],
    },
  },
  {
    name: 'get_cosmos_latest_block',
    description: 'Get latest block information on a Cosmos chain',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain'],
    },
  },
  {
    name: 'get_cosmos_block',
    description: 'Get Cosmos block at specific height',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        height: {
          type: 'number',
          description: 'Block height',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'height'],
    },
  },
  {
    name: 'get_cosmos_params',
    description: 'Get chain parameters for a Cosmos module',
    inputSchema: {
      type: 'object',
      properties: {
        blockchain: {
          type: 'string',
          description: 'Blockchain name',
        },
        module: {
          type: 'string',
          enum: ['staking', 'slashing', 'distribution', 'gov', 'mint'],
          description: 'Module to query parameters for',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['blockchain', 'module'],
    },
  },
  // Sui Tools (11 tools)
  {
    name: 'get_sui_balance',
    description: 'Get SUI balance for an address',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Sui address',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_sui_all_balances',
    description: 'Get all coin balances for a Sui address',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Sui address',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_sui_coins',
    description: 'Get coins owned by an address',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Sui address',
        },
        coinType: {
          type: 'string',
          description: 'Optional: Coin type to filter (e.g., "0x2::sui::SUI")',
        },
        cursor: {
          type: 'string',
          description: 'Optional: Pagination cursor',
        },
        limit: {
          type: 'number',
          description: 'Optional: Number of results to return',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_sui_object',
    description: 'Get object details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: {
          type: 'string',
          description: 'Sui object ID',
        },
        options: {
          type: 'object',
          description: 'Optional: Display options',
          properties: {
            showType: { type: 'boolean' },
            showOwner: { type: 'boolean' },
            showPreviousTransaction: { type: 'boolean' },
            showDisplay: { type: 'boolean' },
            showContent: { type: 'boolean' },
            showBcs: { type: 'boolean' },
            showStorageRebate: { type: 'boolean' },
          },
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['objectId'],
    },
  },
  {
    name: 'get_sui_owned_objects',
    description: 'Get objects owned by an address',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Sui address',
        },
        query: {
          type: 'object',
          description: 'Optional: Query filter and options',
        },
        cursor: {
          type: 'string',
          description: 'Optional: Pagination cursor',
        },
        limit: {
          type: 'number',
          description: 'Optional: Number of results to return',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_sui_transaction',
    description: 'Get Sui transaction details by digest',
    inputSchema: {
      type: 'object',
      properties: {
        txDigest: {
          type: 'string',
          description: 'Transaction digest (hash)',
        },
        options: {
          type: 'object',
          description: 'Optional: Display options',
          properties: {
            showInput: { type: 'boolean' },
            showEffects: { type: 'boolean' },
            showEvents: { type: 'boolean' },
            showObjectChanges: { type: 'boolean' },
            showBalanceChanges: { type: 'boolean' },
          },
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['txDigest'],
    },
  },
  {
    name: 'query_sui_transactions',
    description: 'Query Sui transactions with filters',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          description: 'Query filter and options',
        },
        cursor: {
          type: 'string',
          description: 'Optional: Pagination cursor',
        },
        limit: {
          type: 'number',
          description: 'Optional: Number of results to return',
        },
        descendingOrder: {
          type: 'boolean',
          description: 'Optional: Sort order (default: false)',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_sui_latest_checkpoint',
    description: 'Get latest checkpoint sequence number',
    inputSchema: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
    },
  },
  {
    name: 'get_sui_checkpoint',
    description: 'Get checkpoint details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        checkpointId: {
          type: ['string', 'number'],
          description: 'Checkpoint ID or sequence number',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['checkpointId'],
    },
  },
  {
    name: 'query_sui_events',
    description: 'Query Sui events',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          description: 'Event query filter',
        },
        cursor: {
          type: 'string',
          description: 'Optional: Pagination cursor',
        },
        limit: {
          type: 'number',
          description: 'Optional: Number of results to return',
        },
        descendingOrder: {
          type: 'boolean',
          description: 'Optional: Sort order (default: false)',
        },
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_sui_reference_gas_price',
    description: 'Get reference gas price for Sui transactions',
    inputSchema: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          enum: ['mainnet', 'testnet'],
          description: 'Network type (defaults to mainnet)',
        },
        appId: {
          type: 'string',
          description: 'Optional Grove Portal appId for higher rate limits',
        },
      },
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_endpoints': {
        const category = args?.category as string | undefined;
        const endpoints = category
          ? endpointManager.getEndpointsByCategory(category)
          : endpointManager.getAllEndpoints();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(endpoints, null, 2),
            },
          ],
        };
      }

      case 'get_endpoint_details': {
        const endpointId = args?.endpointId as string;
        const endpoint = endpointManager.getEndpointById(endpointId);

        if (!endpoint) {
          return {
            content: [
              {
                type: 'text',
                text: `Endpoint not found: ${endpointId}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(endpoint, null, 2),
            },
          ],
        };
      }

      case 'call_endpoint': {
        const endpointId = args?.endpointId as string;
        const pathParams = args?.pathParams as Record<string, string> | undefined;
        const queryParams = args?.queryParams as Record<string, string> | undefined;
        const body = args?.body as any;

        const result = await endpointManager.fetchEndpoint(endpointId, {
          pathParams,
          queryParams,
          body,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'list_categories': {
        const categories = endpointManager.getCategories();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(categories, null, 2),
            },
          ],
        };
      }

      case 'get_doc_page': {
        const path = args?.path as string;
        const docPage = await docsManager.getDocPage(path);

        if (!docPage) {
          return {
            content: [
              {
                type: 'text',
                text: `Documentation page not found: ${path}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(docPage, null, 2),
            },
          ],
        };
      }

      case 'get_endpoint_docs': {
        const endpointId = args?.endpointId as string;
        const docPage = await docsManager.getEndpointDocs(endpointId);

        if (!docPage) {
          return {
            content: [
              {
                type: 'text',
                text: `Documentation not found for endpoint: ${endpointId}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(docPage, null, 2),
            },
          ],
        };
      }

      case 'search_docs': {
        const query = args?.query as string;
        const paths = args?.paths as string[] | undefined;

        const results = await docsManager.searchDocs(query, paths);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'add_endpoint': {
        const endpoint = args as any;

        try {
          endpointManager.addEndpoint(endpoint);

          return {
            content: [
              {
                type: 'text',
                text: `Successfully added endpoint: ${endpoint.id}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: error instanceof Error ? error.message : 'Failed to add endpoint',
              },
            ],
            isError: true,
          };
        }
      }

      case 'list_blockchain_services': {
        const category = args?.category as string | undefined;
        const services = category
          ? blockchainService.getServicesByCategory(category)
          : blockchainService.getAllServices();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(services, null, 2),
            },
          ],
        };
      }

      case 'get_blockchain_service': {
        const blockchain = args?.blockchain as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';

        const service = blockchainService.getServiceByBlockchain(blockchain, network);

        if (!service) {
          return {
            content: [
              {
                type: 'text',
                text: `Blockchain service not found: ${blockchain} (${network})`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(service, null, 2),
            },
          ],
        };
      }

      case 'call_rpc_method': {
        const blockchain = args?.blockchain as string;
        const method = args?.method as string;
        const params = (args?.params as any[]) || [];
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const service = blockchainService.getServiceByBlockchain(blockchain, network);

        if (!service) {
          return {
            content: [
              {
                type: 'text',
                text: `Blockchain service not found: ${blockchain} (${network})`,
              },
            ],
            isError: true,
          };
        }

        const result = await blockchainService.callRPCMethod(service.id, method, params, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'query_blockchain': {
        const query = args?.query as string;

        const result = await blockchainService.executeQuery(query);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_supported_methods': {
        const blockchain = args?.blockchain as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';

        const service = blockchainService.getServiceByBlockchain(blockchain, network);

        if (!service) {
          return {
            content: [
              {
                type: 'text',
                text: `Blockchain service not found: ${blockchain} (${network})`,
              },
            ],
            isError: true,
          };
        }

        const methods = blockchainService.getServiceMethods(service.id);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(methods, null, 2),
            },
          ],
        };
      }

      case 'resolve_domain': {
        const domain = args?.domain as string;
        const appId = args?.appId as string | undefined;

        const result = await domainResolver.resolveDomain(domain, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'reverse_resolve_domain': {
        const address = args?.address as string;
        const appId = args?.appId as string | undefined;

        const result = await domainResolver.reverseResolve(address, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_domain_records': {
        const domain = args?.domain as string;
        const keys = args?.keys as string[];
        const appId = args?.appId as string | undefined;

        const result = await domainResolver.getDomainRecords(domain, keys, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_transaction': {
        const blockchain = args?.blockchain as string;
        const txHash = args?.txHash as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await advancedBlockchain.getTransaction(blockchain, txHash, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_transaction_receipt': {
        const blockchain = args?.blockchain as string;
        const txHash = args?.txHash as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await advancedBlockchain.getTransactionReceipt(blockchain, txHash, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'estimate_gas': {
        const blockchain = args?.blockchain as string;
        const transaction = args?.transaction as any;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await advancedBlockchain.estimateGas(blockchain, transaction, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_token_balance': {
        const blockchain = args?.blockchain as string;
        const tokenAddress = args?.tokenAddress as string;
        const walletAddress = args?.walletAddress as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await advancedBlockchain.getTokenBalance(
          blockchain,
          tokenAddress,
          walletAddress,
          network,
          appId
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_token_metadata': {
        const blockchain = args?.blockchain as string;
        const tokenAddress = args?.tokenAddress as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await advancedBlockchain.getTokenMetadata(blockchain, tokenAddress, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_block_details': {
        const blockchain = args?.blockchain as string;
        const blockNumber = args?.blockNumber as string | number;
        const includeTransactions = (args?.includeTransactions as boolean) || false;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await advancedBlockchain.getBlockDetails(
          blockchain,
          blockNumber,
          includeTransactions,
          network,
          appId
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'search_logs': {
        const blockchain = args?.blockchain as string;
        const filter = args?.filter as any;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await advancedBlockchain.searchLogs(blockchain, filter, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'compare_balances': {
        const address = args?.address as string;
        const blockchains = args?.blockchains as string[] | undefined;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await advancedBlockchain.compareBalances(address, blockchains, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_gas_price': {
        const blockchain = args?.blockchain as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await advancedBlockchain.getGasPrice(blockchain, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'convert_units': {
        const value = args?.value as string;
        const fromUnit = args?.fromUnit as 'wei' | 'gwei' | 'eth';
        const toUnit = args?.toUnit as 'wei' | 'gwei' | 'eth';

        const result = advancedBlockchain.convertUnits(value, fromUnit, toUnit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'validate_address': {
        const address = args?.address as string;
        const blockchain = args?.blockchain as string;

        const result = advancedBlockchain.validateAddress(address, blockchain);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'decode_hex': {
        const hex = args?.hex as string;

        const result = advancedBlockchain.decodeHex(hex);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'call_contract_view': {
        const blockchain = args?.blockchain as string;
        const contractAddress = args?.contractAddress as string;
        const data = args?.data as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await advancedBlockchain.callContractView(
          blockchain,
          contractAddress,
          data,
          network,
          appId
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_historical_balance': {
        const blockchain = args?.blockchain as string;
        const address = args?.address as string;
        const blockNumber = args?.blockNumber as string | number;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await advancedBlockchain.getHistoricalBalance(
          blockchain,
          address,
          blockNumber,
          network,
          appId
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_solana_token_balance': {
        const walletAddress = args?.walletAddress as string;
        const mintAddress = args?.mintAddress as string | undefined;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await solanaService.getTokenBalance(walletAddress, mintAddress, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_solana_token_metadata': {
        const mintAddress = args?.mintAddress as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await solanaService.getTokenMetadata(mintAddress, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_solana_balance': {
        const address = args?.address as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await solanaService.getBalance(address, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_solana_account_info': {
        const address = args?.address as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await solanaService.getAccountInfo(address, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_solana_block': {
        const slot = args?.slot as number;
        const includeTransactions = (args?.includeTransactions as boolean) || false;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await solanaService.getBlock(slot, includeTransactions, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_solana_transaction': {
        const signature = args?.signature as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await solanaService.getTransaction(signature, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_solana_prioritization_fees': {
        const addresses = args?.addresses as string[] | undefined;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await solanaService.getRecentPrioritizationFees(addresses, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_solana_signatures': {
        const address = args?.address as string;
        const limit = (args?.limit as number) || 10;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await solanaService.getSignaturesForAddress(address, limit, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_solana_block_height': {
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await solanaService.getBlockHeight(network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_solana_fee_for_message': {
        const message = args?.message as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await solanaService.getFeeForMessage(message, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_solana_program_accounts': {
        const programId = args?.programId as string;
        const filters = args?.filters as any[] | undefined;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await solanaService.getProgramAccounts(programId, filters, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      // Cosmos SDK handlers
      case 'get_cosmos_balance': {
        const blockchain = args?.blockchain as string;
        const address = args?.address as string;
        const denom = args?.denom as string | undefined;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getBalance(blockchain, address, denom, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_all_balances': {
        const blockchain = args?.blockchain as string;
        const address = args?.address as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getAllBalances(blockchain, address, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_account': {
        const blockchain = args?.blockchain as string;
        const address = args?.address as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getAccount(blockchain, address, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_delegations': {
        const blockchain = args?.blockchain as string;
        const delegatorAddress = args?.delegatorAddress as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getDelegations(blockchain, delegatorAddress, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_validators': {
        const blockchain = args?.blockchain as string;
        const status = (args?.status as 'bonded' | 'unbonded' | 'unbonding' | 'all') || 'bonded';
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getValidators(blockchain, status, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_validator': {
        const blockchain = args?.blockchain as string;
        const validatorAddress = args?.validatorAddress as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getValidator(blockchain, validatorAddress, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_rewards': {
        const blockchain = args?.blockchain as string;
        const delegatorAddress = args?.delegatorAddress as string;
        const validatorAddress = args?.validatorAddress as string | undefined;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getRewards(
          blockchain,
          delegatorAddress,
          validatorAddress,
          network,
          appId
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_transaction': {
        const blockchain = args?.blockchain as string;
        const txHash = args?.txHash as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getTransaction(blockchain, txHash, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'search_cosmos_transactions': {
        const blockchain = args?.blockchain as string;
        const events = args?.events as string[];
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.searchTransactions(blockchain, events, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_proposals': {
        const blockchain = args?.blockchain as string;
        const status = args?.status as
          | 'deposit_period'
          | 'voting_period'
          | 'passed'
          | 'rejected'
          | 'failed'
          | undefined;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getProposals(blockchain, status, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_proposal': {
        const blockchain = args?.blockchain as string;
        const proposalId = args?.proposalId as number;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getProposal(blockchain, proposalId, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_proposal_votes': {
        const blockchain = args?.blockchain as string;
        const proposalId = args?.proposalId as number;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getProposalVotes(blockchain, proposalId, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_latest_block': {
        const blockchain = args?.blockchain as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getLatestBlock(blockchain, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_block': {
        const blockchain = args?.blockchain as string;
        const height = args?.height as number;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getBlockByHeight(blockchain, height, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_cosmos_params': {
        const blockchain = args?.blockchain as string;
        const module = args?.module as 'staking' | 'slashing' | 'distribution' | 'gov' | 'mint';
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await cosmosService.getParams(blockchain, module, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      // Sui handlers
      case 'get_sui_balance': {
        const address = args?.address as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await suiService.getBalance(address, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_sui_all_balances': {
        const address = args?.address as string;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await suiService.getAllBalances(address, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_sui_coins': {
        const address = args?.address as string;
        const coinType = args?.coinType as string | undefined;
        const cursor = args?.cursor as string | undefined;
        const limit = args?.limit as number | undefined;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await suiService.getCoins(address, coinType, cursor, limit, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_sui_object': {
        const objectId = args?.objectId as string;
        const options = args?.options as any;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await suiService.getObject(objectId, options, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_sui_owned_objects': {
        const address = args?.address as string;
        const query = args?.query as any;
        const cursor = args?.cursor as string | undefined;
        const limit = args?.limit as number | undefined;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await suiService.getOwnedObjects(address, query, cursor, limit, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_sui_transaction': {
        const txDigest = args?.txDigest as string;
        const options = args?.options as any;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await suiService.getTransaction(txDigest, options, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'query_sui_transactions': {
        const query = args?.query as any;
        const cursor = args?.cursor as string | undefined;
        const limit = args?.limit as number | undefined;
        const descendingOrder = args?.descendingOrder as boolean | undefined;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await suiService.queryTransactions(
          query,
          cursor,
          limit,
          descendingOrder,
          network,
          appId
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_sui_latest_checkpoint': {
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await suiService.getLatestCheckpoint(network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_sui_checkpoint': {
        const checkpointId = args?.checkpointId as string | number;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await suiService.getCheckpoint(checkpointId, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'query_sui_events': {
        const query = args?.query as any;
        const cursor = args?.cursor as string | undefined;
        const limit = args?.limit as number | undefined;
        const descendingOrder = args?.descendingOrder as boolean | undefined;
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await suiService.queryEvents(query, cursor, limit, descendingOrder, network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      case 'get_sui_reference_gas_price': {
        const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';
        const appId = args?.appId as string | undefined;

        const result = await suiService.getReferenceGasPrice(network, appId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: !result.success,
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: error instanceof Error ? error.message : 'An error occurred',
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Grove's Public Endpoints for Pocket Network MCP server running on stdio");
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
