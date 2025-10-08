import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CosmosService } from '../services/cosmos-service.js';

/**
 * Register Cosmos SDK tools with the MCP server
 * @param server - The MCP server instance
 * @param cosmosService - The Cosmos service instance
 */
export function registerCosmosHandlers(
  server: Server,
  cosmosService: CosmosService
): Tool[] {
  const tools: Tool[] = [
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
        },
        required: ['blockchain', 'module'],
      },
    },
  ];

  return tools;
}

/**
 * Handle Cosmos tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param cosmosService - The Cosmos service instance
 */
export async function handleCosmosTool(
  name: string,
  args: any,
  cosmosService: CosmosService
) {
  switch (name) {
    case 'get_cosmos_balance': {
      const blockchain = args?.blockchain as string;
      const address = args?.address as string;
      const denom = args?.denom as string | undefined;
      const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';

      const result = await cosmosService.getBalance(blockchain, address, denom, network);

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

      const result = await cosmosService.getAllBalances(blockchain, address, network);

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

      const result = await cosmosService.getAccount(blockchain, address, network);

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

      const result = await cosmosService.getDelegations(blockchain, delegatorAddress, network);

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

      const result = await cosmosService.getValidators(blockchain, status, network);

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

      const result = await cosmosService.getValidator(blockchain, validatorAddress, network);

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

      const result = await cosmosService.getRewards(
        blockchain,
        delegatorAddress,
        validatorAddress,
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

    case 'get_cosmos_transaction': {
      const blockchain = args?.blockchain as string;
      const txHash = args?.txHash as string;
      const network = (args?.network as 'mainnet' | 'testnet') || 'mainnet';

      const result = await cosmosService.getTransaction(blockchain, txHash, network);

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

      const result = await cosmosService.searchTransactions(blockchain, events, network);

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

      const result = await cosmosService.getProposals(blockchain, status, network);

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

      const result = await cosmosService.getProposal(blockchain, proposalId, network);

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

      const result = await cosmosService.getProposalVotes(blockchain, proposalId, network);

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

      const result = await cosmosService.getLatestBlock(blockchain, network);

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

      const result = await cosmosService.getBlockByHeight(blockchain, height, network);

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

      const result = await cosmosService.getParams(blockchain, module, network);

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
