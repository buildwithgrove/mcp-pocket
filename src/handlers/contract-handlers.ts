import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AdvancedBlockchainService } from '../services/advanced-blockchain-service.js';

/**
 * Register smart contract tools with the MCP server
 * @param server - The MCP server instance
 * @param advancedBlockchain - The advanced blockchain service instance
 */
export function registerContractHandlers(
  server: Server,
  advancedBlockchain: AdvancedBlockchainService
): Tool[] {
  const tools: Tool[] = [
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
  ];

  return tools;
}

/**
 * Handle contract tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param advancedBlockchain - The advanced blockchain service instance
 */
export async function handleContractTool(
  name: string,
  args: any,
  advancedBlockchain: AdvancedBlockchainService
) {
  switch (name) {
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

    default:
      return null;
  }
}
