# Extending Grove's Public Endpoints for Pocket Network

This guide explains how to extend the MCP server with new endpoints and functionality.

## Quick Start: Adding an Endpoint

### Option 1: Configuration File (Recommended for static endpoints)

1. Open `src/config/endpoints.json`
2. Add your endpoint to the `endpoints` array:

```json
{
  "id": "get_products",
  "name": "Get Products",
  "path": "/products",
  "method": "GET",
  "description": "Retrieve all products",
  "category": "catalog",
  "parameters": [
    {
      "name": "limit",
      "type": "number",
      "description": "Maximum number of products to return",
      "required": false,
      "default": 20
    },
    {
      "name": "offset",
      "type": "number",
      "description": "Number of products to skip",
      "required": false,
      "default": 0
    }
  ]
}
```

3. Add the category if new:

```json
{
  "categories": ["discovery", "data", "operations", "admin", "catalog"]
}
```

4. Rebuild: `npm run build`

### Option 2: Runtime Addition (Great for testing)

Use the `add_endpoint` MCP tool:

```typescript
// From Claude Code or any MCP client
add_endpoint({
  id: "get_products",
  name: "Get Products",
  path: "/products",
  method: "GET",
  description: "Retrieve all products",
  category: "catalog"
})
```

## Endpoint Configuration Schema

### Required Fields

- `id` (string): Unique identifier, used for tool calls
- `name` (string): Human-readable name
- `path` (string): URL path, supports params like `/users/:id`
- `method` (string): HTTP method (GET, POST, PUT, DELETE, PATCH)
- `description` (string): What the endpoint does
- `category` (string): Organizational category

### Optional Fields

- `parameters` (array): Parameter definitions
- `requiresAuth` (boolean): Whether authentication is needed

### Parameter Schema

```json
{
  "name": "userId",
  "type": "string",
  "description": "The user's unique identifier",
  "required": true,
  "default": null
}
```

## Path Parameters

Use `:paramName` syntax in paths:

```json
{
  "path": "/users/:userId/orders/:orderId",
  "parameters": [
    {
      "name": "userId",
      "type": "string",
      "required": true
    },
    {
      "name": "orderId",
      "type": "string",
      "required": true
    }
  ]
}
```

Call with:

```typescript
call_endpoint({
  endpointId: "get_order",
  pathParams: {
    userId: "123",
    orderId: "456"
  }
})
```

## Query Parameters

Add to the endpoint call:

```typescript
call_endpoint({
  endpointId: "get_products",
  queryParams: {
    limit: "50",
    category: "electronics"
  }
})
// Results in: /products?limit=50&category=electronics
```

## Request Bodies

For POST/PUT/PATCH requests:

```typescript
call_endpoint({
  endpointId: "create_user",
  body: {
    name: "John Doe",
    email: "john@example.com"
  }
})
```

## Adding New Categories

Categories help organize endpoints. To add a new category:

1. Add to `endpoints.json`:

```json
{
  "categories": ["existing", "new_category"]
}
```

2. Use in endpoint definitions:

```json
{
  "id": "my_endpoint",
  "category": "new_category",
  ...
}
```

## Advanced: Custom Tools

Add new MCP tools by editing `src/index.ts`:

```typescript
const tools: Tool[] = [
  // ... existing tools
  {
    name: 'batch_call_endpoints',
    description: 'Call multiple endpoints in sequence',
    inputSchema: {
      type: 'object',
      properties: {
        endpointIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of endpoint IDs to call',
        },
      },
      required: ['endpointIds'],
    },
  },
];

// Add handler in CallToolRequestSchema
case 'batch_call_endpoints': {
  const endpointIds = args?.endpointIds as string[];
  const results = [];

  for (const id of endpointIds) {
    const result = await endpointManager.fetchEndpoint(id);
    results.push({ endpointId: id, result });
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
  };
}
```

## Advanced: Custom Managers

Create specialized managers for specific functionality:

```typescript
// src/services/auth-manager.ts
export class AuthManager {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async authenticateRequest(url: string, options: RequestInit): Promise<RequestInit> {
    return {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.apiKey}`,
      },
    };
  }
}
```

Integrate in `endpoint-manager.ts`:

```typescript
import { AuthManager } from './auth-manager.js';

export class EndpointManager {
  private authManager?: AuthManager;

  setAuthManager(authManager: AuthManager) {
    this.authManager = authManager;
  }

  async fetchEndpoint(...) {
    let fetchOptions = { ... };

    if (this.authManager && endpoint.requiresAuth) {
      fetchOptions = await this.authManager.authenticateRequest(url, fetchOptions);
    }

    // ... rest of fetch logic
  }
}
```

## Advanced: Response Transformers

Add response transformation:

```typescript
// src/services/response-transformer.ts
export interface ResponseTransformer {
  transform(data: any): any;
}

export class DateTransformer implements ResponseTransformer {
  transform(data: any): any {
    // Convert ISO date strings to Date objects
    return JSON.parse(JSON.stringify(data), (key, value) => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return new Date(value);
      }
      return value;
    });
  }
}
```

## Best Practices

1. **Naming Conventions**
   - Use snake_case for endpoint IDs: `get_user`, `create_order`
   - Use descriptive names: `get_user_orders` not `guo`

2. **Categories**
   - Keep categories broad: `users`, `orders`, `products`
   - Don't create too many (5-10 is ideal)

3. **Documentation**
   - Write clear descriptions for each endpoint
   - Document required vs optional parameters
   - Include example values in descriptions

4. **Versioning**
   - Include version in path if needed: `/v1/users`
   - Use separate endpoint IDs for different versions: `get_user_v1`, `get_user_v2`

5. **Error Handling**
   - Always check `result.success` before using data
   - Provide meaningful error messages

## Examples by Use Case

### REST CRUD Operations

```json
{
  "endpoints": [
    {
      "id": "list_items",
      "path": "/items",
      "method": "GET",
      "description": "List all items",
      "category": "items"
    },
    {
      "id": "get_item",
      "path": "/items/:id",
      "method": "GET",
      "description": "Get a specific item",
      "category": "items"
    },
    {
      "id": "create_item",
      "path": "/items",
      "method": "POST",
      "description": "Create a new item",
      "category": "items"
    },
    {
      "id": "update_item",
      "path": "/items/:id",
      "method": "PUT",
      "description": "Update an item",
      "category": "items"
    },
    {
      "id": "delete_item",
      "path": "/items/:id",
      "method": "DELETE",
      "description": "Delete an item",
      "category": "items"
    }
  ]
}
```

### Search Endpoints

```json
{
  "id": "search_products",
  "path": "/search/products",
  "method": "GET",
  "description": "Search products by query",
  "category": "search",
  "parameters": [
    {
      "name": "q",
      "type": "string",
      "description": "Search query",
      "required": true
    },
    {
      "name": "filters",
      "type": "object",
      "description": "Filter criteria",
      "required": false
    }
  ]
}
```

### Batch Operations

```json
{
  "id": "batch_update_users",
  "path": "/users/batch",
  "method": "POST",
  "description": "Update multiple users at once",
  "category": "users",
  "parameters": [
    {
      "name": "updates",
      "type": "array",
      "description": "Array of user updates",
      "required": true
    }
  ]
}
```

## Testing New Endpoints

After adding an endpoint:

1. Rebuild: `npm run build`
2. Restart Claude Code MCP server
3. Test with:

```
List all endpoints in category "your_category"

Get details for endpoint "your_endpoint_id"

Call the your_endpoint_id endpoint with [parameters]
```

## Troubleshooting

**Endpoint not appearing in list:**
- Check `endpoints.json` syntax
- Ensure you rebuilt: `npm run build`
- Verify the endpoint has a unique ID

**Endpoint call fails:**
- Verify the base URL in `endpoints.json`
- Check path parameter syntax
- Ensure required parameters are provided

**TypeScript errors:**
- Run `npm run build` to see specific errors
- Check that your endpoint matches the `EndpointConfig` type
