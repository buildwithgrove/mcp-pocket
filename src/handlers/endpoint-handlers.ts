import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { EndpointManager } from '../services/endpoint-manager.js';

/**
 * Register endpoint management tools with the MCP server
 * @param server - The MCP server instance
 * @param endpointManager - The endpoint manager service instance
 */
export function registerEndpointHandlers(
  server: Server,
  endpointManager: EndpointManager
): Tool[] {
  const tools: Tool[] = [
    {
      name: 'list_endpoints',
      description: "List all available Grove's public endpoints for Pocket Network, optionally filtered by category",
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Optional category to filter endpoints',
          },
        },
      },
    },
    {
      name: 'get_endpoint_details',
      description: 'Get detailed information about a specific endpoint',
      inputSchema: {
        type: 'object',
        properties: {
          endpointId: {
            type: 'string',
            description: 'The ID of the endpoint to retrieve',
          },
        },
        required: ['endpointId'],
      },
    },
    {
      name: 'call_endpoint',
      description: "Call a Grove endpoint for Pocket Network with optional parameters",
      inputSchema: {
        type: 'object',
        properties: {
          endpointId: {
            type: 'string',
            description: 'The ID of the endpoint to call',
          },
          pathParams: {
            type: 'object',
            description: 'Path parameters (e.g., {id: "123"} for /users/:id)',
          },
          queryParams: {
            type: 'object',
            description: 'Query parameters to append to the URL',
          },
          body: {
            type: 'object',
            description: 'Request body for POST/PUT/PATCH requests',
          },
        },
        required: ['endpointId'],
      },
    },
    {
      name: 'list_categories',
      description: 'List all available endpoint categories',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'add_endpoint',
      description: 'Dynamically add a new endpoint configuration (for extensibility)',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the endpoint',
          },
          name: {
            type: 'string',
            description: 'Human-readable name',
          },
          path: {
            type: 'string',
            description: 'URL path (e.g., "/api/users/:id")',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            description: 'HTTP method',
          },
          description: {
            type: 'string',
            description: 'Description of what the endpoint does',
          },
          category: {
            type: 'string',
            description: 'Category for organization',
          },
        },
        required: ['id', 'name', 'path', 'method', 'description', 'category'],
      },
    },
  ];

  return tools;
}

/**
 * Handle endpoint tool execution
 * @param name - Tool name
 * @param args - Tool arguments
 * @param endpointManager - The endpoint manager service instance
 */
export async function handleEndpointTool(
  name: string,
  args: any,
  endpointManager: EndpointManager
) {
  switch (name) {
    case 'list_endpoints': {
      const category = args?.category as string | undefined;
      const endpoints = category
        ? endpointManager.getEndpointsByCategory(category)
        : endpointManager.getAllEndpoints();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(endpoints, null, 2),
          },
        ],
      };
    }

    case 'get_endpoint_details': {
      const endpointId = args?.endpointId as string;
      const endpoint = endpointManager.getEndpointById(endpointId);

      if (!endpoint) {
        return {
          content: [
            {
              type: 'text',
              text: `Endpoint not found: ${endpointId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(endpoint, null, 2),
          },
        ],
      };
    }

    case 'call_endpoint': {
      const endpointId = args?.endpointId as string;
      const pathParams = args?.pathParams as Record<string, string> | undefined;
      const queryParams = args?.queryParams as Record<string, string> | undefined;
      const body = args?.body as any;

      const result = await endpointManager.fetchEndpoint(endpointId, {
        pathParams,
        queryParams,
        body,
      });

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

    case 'list_categories': {
      const categories = endpointManager.getCategories();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(categories, null, 2),
          },
        ],
      };
    }

    case 'add_endpoint': {
      const endpoint = args as any;

      try {
        endpointManager.addEndpoint(endpoint);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully added endpoint: ${endpoint.id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: error instanceof Error ? error.message : 'Failed to add endpoint',
            },
          ],
          isError: true,
        };
      }
    }

    default:
      return null;
  }
}
