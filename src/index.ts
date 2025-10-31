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

// Import all handler modules
import {
  registerBlockchainHandlers,
  handleBlockchainTool,
  registerDomainHandlers,
  handleDomainTool,
  registerTransactionHandlers,
  handleTransactionTool,
  registerTokenHandlers,
  handleTokenTool,
  registerMultichainHandlers,
  handleMultichainTool,
  registerContractHandlers,
  handleContractTool,
  registerUtilityHandlers,
  handleUtilityTool,
  registerEndpointHandlers,
  handleEndpointTool,
  registerSolanaHandlers,
  handleSolanaTool,
  registerCosmosHandlers,
  handleCosmosTool,
  registerSuiHandlers,
  handleSuiTool,
  registerDocsHandlers,
  handleDocsTool,
} from './handlers/index.js';

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
    name: 'mcp-pocket',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register all tools from handlers
const tools: Tool[] = [
  ...registerBlockchainHandlers(server, blockchainService),
  ...registerDomainHandlers(server, domainResolver),
  ...registerTransactionHandlers(server, advancedBlockchain),
  ...registerTokenHandlers(server, advancedBlockchain),
  ...registerMultichainHandlers(server, advancedBlockchain),
  ...registerContractHandlers(server, advancedBlockchain),
  ...registerUtilityHandlers(server, advancedBlockchain),
  ...registerEndpointHandlers(server, endpointManager),
  ...registerSolanaHandlers(server, solanaService),
  ...registerCosmosHandlers(server, cosmosService),
  ...registerSuiHandlers(server, suiService),
  ...registerDocsHandlers(server, docsManager),
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Try each handler in sequence until one handles the tool
    let result =
      (await handleBlockchainTool(name, args, blockchainService)) ||
      (await handleDomainTool(name, args, domainResolver)) ||
      (await handleTransactionTool(name, args, advancedBlockchain)) ||
      (await handleTokenTool(name, args, advancedBlockchain)) ||
      (await handleMultichainTool(name, args, advancedBlockchain)) ||
      (await handleContractTool(name, args, advancedBlockchain)) ||
      (await handleUtilityTool(name, args, advancedBlockchain)) ||
      (await handleEndpointTool(name, args, endpointManager)) ||
      (await handleSolanaTool(name, args, solanaService)) ||
      (await handleCosmosTool(name, args, cosmosService)) ||
      (await handleSuiTool(name, args, suiService)) ||
      (await handleDocsTool(name, args, docsManager));

    // If no handler processed the tool, return an error
    if (!result) {
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

    return result;
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
  console.error("Pocket Network MCP server running on stdio");
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
