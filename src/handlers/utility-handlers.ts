import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AdvancedBlockchainService } from '../services/advanced-blockchain-service.js';

/**
 * Register utility tools with the MCP server
 * @param server - The MCP server instance
 * @param advancedBlockchain - The advanced blockchain service instance
 */
export function registerUtilityHandlers(
  server: Server,
  advancedBlockchain: AdvancedBlockchainService
): Tool[] {
  const tools: Tool[] = [
    {
      name: 'convert_units',
      description: 'Convert between wei, gwei, and eth units',
      inputSchema: {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            description: 'Value to convert',
          },
          fromUnit: {
            type: 'string',
            enum: ['wei', 'gwei', 'eth'],
            description: 'Source unit',
          },
          toUnit: {
            type: 'string',
            enum: ['wei', 'gwei', 'eth'],
            description: 'Target unit',
          },
        },
        required: ['value', 'fromUnit', 'toUnit'],
      },
    },
    {
      name: 'validate_address',
      description: 'Validate address format for a specific blockchain',
      inputSchema: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Address to validate',
          },
          blockchain: {
            type: 'string',
            description: 'Blockchain name',
          },
        },
        required: ['address', 'blockchain'],
      },
    },
    {
      name: 'decode_hex',
      description: 'Decode hex string to UTF-8, ASCII, and bytes',
      inputSchema: {
        type: 'object',
        properties: {
          hex: {
            type: 'string',
            description: 'Hex string to decode',
          },
        },
        required: ['hex'],
      },
    },
  ];

  return tools;
}

/**
 * Handle utility tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param advancedBlockchain - The advanced blockchain service instance
 */
export async function handleUtilityTool(
  name: string,
  args: any,
  advancedBlockchain: AdvancedBlockchainService
) {
  switch (name) {
    case 'convert_units': {
      const value = args?.value as string;
      const fromUnit = args?.fromUnit as 'wei' | 'gwei' | 'eth';
      const toUnit = args?.toUnit as 'wei' | 'gwei' | 'eth';

      const result = advancedBlockchain.convertUnits(value, fromUnit, toUnit);

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

    case 'validate_address': {
      const address = args?.address as string;
      const blockchain = args?.blockchain as string;

      const result = advancedBlockchain.validateAddress(address, blockchain);

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

    case 'decode_hex': {
      const hex = args?.hex as string;

      const result = advancedBlockchain.decodeHex(hex);

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
