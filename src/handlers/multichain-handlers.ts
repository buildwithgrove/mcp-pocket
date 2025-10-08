import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AdvancedBlockchainService } from '../services/advanced-blockchain-service.js';

/**
 * Register multi-chain tools with the MCP server
 * @param server - The MCP server instance
 * @param advancedBlockchain - The advanced blockchain service instance
 */
export function registerMultichainHandlers(
  server: Server,
  advancedBlockchain: AdvancedBlockchainService
): Tool[] {
  const tools: Tool[] = [
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
        },
        required: ['address'],
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
        },
        required: ['blockchain', 'address', 'blockNumber'],
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
        },
        required: ['blockchain'],
      },
    },
  ];

  return tools;
}

/**
 * Handle multi-chain tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param advancedBlockchain - The advanced blockchain service instance
 */
export async function handleMultichainTool(
  name: string,
  args: any,
  advancedBlockchain: AdvancedBlockchainService
) {
  switch (name) {
    case 'compare_balances': {
      const address = args?.address as string;
      const blockchains = args?.blockchains as string[] | undefined;
      const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';

      const result = await advancedBlockchain.compareBalances(address, blockchains, network);

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

      const result = await advancedBlockchain.getHistoricalBalance(
        blockchain,
        address,
        blockNumber,
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

    case 'get_gas_price': {
      const blockchain = args?.blockchain as string;
      const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';

      const result = await advancedBlockchain.getGasPrice(blockchain, network);

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
