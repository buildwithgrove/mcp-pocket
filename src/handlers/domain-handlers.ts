import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { DomainResolverService } from '../services/domain-resolver.js';

/**
 * Register domain resolution tools with the MCP server
 * @param server - The MCP server instance
 * @param domainResolver - The domain resolver service instance
 */
export function registerDomainHandlers(
  server: Server,
  domainResolver: DomainResolverService
): Tool[] {
  const tools: Tool[] = [
    {
      name: 'resolve_domain',
      description: 'Resolve a blockchain domain name (ENS .eth or Unstoppable Domains) to an address using Pocket Network endpoints',
      inputSchema: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'The domain name to resolve (e.g., "vitalik.eth", "alice.crypto")',
          },
        },
        required: ['domain'],
      },
    },
    {
      name: 'reverse_resolve_domain',
      description: 'Reverse resolve an Ethereum address to its ENS domain name',
      inputSchema: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Ethereum address to reverse resolve',
          },
        },
        required: ['address'],
      },
    },
    {
      name: 'get_domain_records',
      description: 'Get ENS text records for a domain (e.g., avatar, email, url, twitter, github)',
      inputSchema: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'ENS domain name',
          },
          keys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Text record keys to fetch (e.g., ["avatar", "email", "url", "com.twitter", "com.github"])',
          },
        },
        required: ['domain', 'keys'],
      },
    },
  ];

  return tools;
}

/**
 * Handle domain tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param domainResolver - The domain resolver service instance
 */
export async function handleDomainTool(
  name: string,
  args: any,
  domainResolver: DomainResolverService
) {
  switch (name) {
    case 'resolve_domain': {
      const domain = args?.domain as string;

      const result = await domainResolver.resolveDomain(domain);

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

    case 'reverse_resolve_domain': {
      const address = args?.address as string;

      const result = await domainResolver.reverseResolve(address);

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

    case 'get_domain_records': {
      const domain = args?.domain as string;
      const keys = args?.keys as string[];

      const result = await domainResolver.getDomainRecords(domain, keys);

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
