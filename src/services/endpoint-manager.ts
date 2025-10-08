import { EndpointConfig, EndpointResponse, ServerConfig } from '../types.js';

/**
 * Manages endpoint configurations and provides methods to interact with them
 */
export class EndpointManager {
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
  }

  /**
   * Get all configured endpoints
   */
  getAllEndpoints(): EndpointConfig[] {
    return this.config.endpoints;
  }

  /**
   * Get endpoints by category
   */
  getEndpointsByCategory(category: string): EndpointConfig[] {
    return this.config.endpoints.filter(ep => ep.category === category);
  }

  /**
   * Get a specific endpoint by ID
   */
  getEndpointById(id: string): EndpointConfig | undefined {
    return this.config.endpoints.find(ep => ep.id === id);
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    return this.config.categories;
  }

  /**
   * Build full URL for an endpoint
   */
  buildEndpointUrl(endpointId: string, pathParams?: Record<string, string>): string {
    const endpoint = this.getEndpointById(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${endpointId}`);
    }

    let path = endpoint.path;

    // Replace path parameters (e.g., /users/:id -> /users/123)
    if (pathParams) {
      Object.entries(pathParams).forEach(([key, value]) => {
        path = path.replace(`:${key}`, value);
      });
    }

    return `${this.config.baseUrls.endpoints}${path}`;
  }

  /**
   * Fetch data from an endpoint
   */
  async fetchEndpoint(
    endpointId: string,
    options?: {
      pathParams?: Record<string, string>;
      queryParams?: Record<string, string>;
      body?: any;
    }
  ): Promise<EndpointResponse> {
    const endpoint = this.getEndpointById(endpointId);
    if (!endpoint) {
      return {
        success: false,
        error: `Endpoint not found: ${endpointId}`
      };
    }

    try {
      const url = new URL(this.buildEndpointUrl(endpointId, options?.pathParams));

      // Add query parameters
      if (options?.queryParams) {
        Object.entries(options.queryParams).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const fetchOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (options?.body && endpoint.method !== 'GET') {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url.toString(), fetchOptions);
      const data = await response.json();

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.message || `HTTP ${response.status}`,
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: url.toString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: endpointId
        }
      };
    }
  }

  /**
   * Add a new endpoint configuration dynamically
   */
  addEndpoint(endpoint: EndpointConfig): void {
    // Check if endpoint already exists
    if (this.config.endpoints.find(ep => ep.id === endpoint.id)) {
      throw new Error(`Endpoint with ID ${endpoint.id} already exists`);
    }

    // Add category if it doesn't exist
    if (!this.config.categories.includes(endpoint.category)) {
      this.config.categories.push(endpoint.category);
    }

    this.config.endpoints.push(endpoint);
  }
}
