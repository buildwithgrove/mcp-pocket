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

        const result = await blockchainService.callRPCMethod(service.id, method, params);

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
