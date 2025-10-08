import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AdvancedBlockchainService } from '../services/advanced-blockchain-service.js';

/**
 * Register transaction and block tools with the MCP server
 * @param server - The MCP server instance
 * @param advancedBlockchain - The advanced blockchain service instance
 */
export function registerTransactionHandlers(
  server: Server,
  advancedBlockchain: AdvancedBlockchainService
): Tool[] {
  const tools: Tool[] = [
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
  ];

  return tools;
}

/**
 * Handle transaction tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param advancedBlockchain - The advanced blockchain service instance
 */
export async function handleTransactionTool(
  name: string,
  args: any,
  advancedBlockchain: AdvancedBlockchainService
) {
  switch (name) {
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

    default:
      return null;
  }
}
