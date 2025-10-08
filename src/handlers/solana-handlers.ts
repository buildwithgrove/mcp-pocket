import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SolanaService } from '../services/solana-service.js';

/**
 * Register Solana tools with the MCP server
 * @param server - The MCP server instance
 * @param solanaService - The Solana service instance
 */
export function registerSolanaHandlers(
  server: Server,
  solanaService: SolanaService
): Tool[] {
  const tools: Tool[] = [
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
        },
        required: ['programId'],
      },
    },
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
        },
        required: ['address'],
      },
    },
  ];

  return tools;
}

/**
 * Handle Solana tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param solanaService - The Solana service instance
 */
export async function handleSolanaTool(
  name: string,
  args: any,
  solanaService: SolanaService
) {
  switch (name) {
    case 'get_solana_token_balance': {
      const walletAddress = args?.walletAddress as string;
      const mintAddress = args?.mintAddress as string | undefined;
      const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';

      const result = await solanaService.getTokenBalance(walletAddress, mintAddress, network);

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

      const result = await solanaService.getTokenMetadata(mintAddress, network);

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

      const result = await solanaService.getBalance(address, network);

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

      const result = await solanaService.getAccountInfo(address, network);

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

      const result = await solanaService.getBlock(slot, includeTransactions, network);

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

      const result = await solanaService.getTransaction(signature, network);

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

      const result = await solanaService.getRecentPrioritizationFees(addresses, network);

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

      const result = await solanaService.getSignaturesForAddress(address, limit, network);

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

      const result = await solanaService.getBlockHeight(network);

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

      const result = await solanaService.getFeeForMessage(message, network);

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

      const result = await solanaService.getProgramAccounts(programId, filters, network);

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
