import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AdvancedBlockchainService } from '../services/advanced-blockchain-service.js';

/**
 * Register token tools with the MCP server
 * @param server - The MCP server instance
 * @param advancedBlockchain - The advanced blockchain service instance
 */
export function registerTokenHandlers(
  server: Server,
  advancedBlockchain: AdvancedBlockchainService
): Tool[] {
  const tools: Tool[] = [
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
        },
        required: ['blockchain', 'tokenAddress'],
      },
    },
  ];

  return tools;
}

/**
 * Handle token tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param advancedBlockchain - The advanced blockchain service instance
 */
export async function handleTokenTool(
  name: string,
  args: any,
  advancedBlockchain: AdvancedBlockchainService
) {
  switch (name) {
    case 'get_token_balance': {
      const blockchain = args?.blockchain as string;
      const tokenAddress = args?.tokenAddress as string;
      const walletAddress = args?.walletAddress as string;
      const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';

      const result = await advancedBlockchain.getTokenBalance(
        blockchain,
        tokenAddress,
        walletAddress,
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

    case 'get_token_metadata': {
      const blockchain = args?.blockchain as string;
      const tokenAddress = args?.tokenAddress as string;
      const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';

      const result = await advancedBlockchain.getTokenMetadata(blockchain, tokenAddress, network);

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
