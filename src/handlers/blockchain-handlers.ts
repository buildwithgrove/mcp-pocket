import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BlockchainRPCService } from '../services/blockchain-service.js';

/**
 * Register blockchain-related tools with the MCP server
 * @param server - The MCP server instance
 * @param blockchainService - The blockchain RPC service instance
 */
export function registerBlockchainHandlers(
  server: Server,
  blockchainService: BlockchainRPCService
): Tool[] {
  const tools: Tool[] = [
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

  return tools;
}

/**
 * Handle blockchain tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param blockchainService - The blockchain RPC service instance
 */
export async function handleBlockchainTool(
  name: string,
  args: any,
  blockchainService: BlockchainRPCService
) {
  switch (name) {
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
      return null;
  }
}
