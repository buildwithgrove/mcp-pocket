import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { DocsManager } from '../services/docs-manager.js';

/**
 * Register documentation tools with the MCP server
 * @param server - The MCP server instance
 * @param docsManager - The documentation manager service instance
 */
export function registerDocsHandlers(
  server: Server,
  docsManager: DocsManager
): Tool[] {
  const tools: Tool[] = [
    {
      name: 'get_doc_page',
      description: 'Retrieve a documentation page from api.pocket.network/docs',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path to the documentation page (e.g., "/api/overview")',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_endpoint_docs',
      description: 'Get documentation for a specific endpoint',
      inputSchema: {
        type: 'object',
        properties: {
          endpointId: {
            type: 'string',
            description: 'The ID of the endpoint',
          },
        },
        required: ['endpointId'],
      },
    },
    {
      name: 'search_docs',
      description: 'Search Pocket Network documentation for a specific query',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query',
          },
          paths: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Optional array of paths to search within',
          },
        },
        required: ['query'],
      },
    },
  ];

  return tools;
}

/**
 * Handle documentation tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param docsManager - The documentation manager service instance
 */
export async function handleDocsTool(
  name: string,
  args: any,
  docsManager: DocsManager
) {
  switch (name) {
    case 'get_doc_page': {
      const path = args?.path as string;
      const docPage = await docsManager.getDocPage(path);

      if (!docPage) {
        return {
          content: [
            {
              type: 'text',
              text: `Documentation page not found: ${path}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(docPage, null, 2),
          },
        ],
      };
    }

    case 'get_endpoint_docs': {
      const endpointId = args?.endpointId as string;
      const docPage = await docsManager.getEndpointDocs(endpointId);

      if (!docPage) {
        return {
          content: [
            {
              type: 'text',
              text: `Documentation not found for endpoint: ${endpointId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(docPage, null, 2),
          },
        ],
      };
    }

    case 'search_docs': {
      const query = args?.query as string;
      const paths = args?.paths as string[] | undefined;

      const results = await docsManager.searchDocs(query, paths);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    default:
      return null;
  }
}
