import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SuiService } from '../services/sui-service.js';

/**
 * Register Sui tools with the MCP server
 * @param server - The MCP server instance
 * @param suiService - The Sui service instance
 */
export function registerSuiHandlers(
  server: Server,
  suiService: SuiService
): Tool[] {
  const tools: Tool[] = [
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
        },
      },
    },
  ];

  return tools;
}

/**
 * Handle Sui tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param suiService - The Sui service instance
 */
export async function handleSuiTool(
  name: string,
  args: any,
  suiService: SuiService
) {
  switch (name) {
    case 'get_sui_balance': {
      const address = args?.address as string;
      const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';

      const result = await suiService.getBalance(address, network);

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

      const result = await suiService.getAllBalances(address, network);

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

      const result = await suiService.getCoins(address, coinType, cursor, limit, network);

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

      const result = await suiService.getObject(objectId, options, network);

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

      const result = await suiService.getOwnedObjects(address, query, cursor, limit, network);

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

      const result = await suiService.getTransaction(txDigest, options, network);

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

      const result = await suiService.queryTransactions(
        query,
        cursor,
        limit,
        descendingOrder,
        network
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

      const result = await suiService.getLatestCheckpoint(network);

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

      const result = await suiService.getCheckpoint(checkpointId, network);

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

      const result = await suiService.queryEvents(query, cursor, limit, descendingOrder, network);

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

      const result = await suiService.getReferenceGasPrice(network);

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
      return null;
  }
}
