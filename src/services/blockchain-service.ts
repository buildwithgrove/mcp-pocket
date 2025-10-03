import { BlockchainService, RPCMethod, EndpointResponse } from '../types.js';

/**
 * Service for interacting with blockchain RPC endpoints
 */
export class BlockchainRPCService {
  private services: Map<string, BlockchainService>;
  private methodAliases: Map<string, string[]>;

  constructor(servicesData: any) {
    this.services = new Map();
    this.methodAliases = new Map(Object.entries(servicesData.methodAliases || {}));

    // Index services by ID and blockchain name
    for (const service of servicesData.services) {
      this.services.set(service.id, service);
      this.services.set(`${service.blockchain}-${service.network}`, service);
    }
  }

  /**
   * Get all available blockchain services
   */
  getAllServices(): BlockchainService[] {
    const seen = new Set<string>();
    const services: BlockchainService[] = [];

    for (const service of this.services.values()) {
      if (!seen.has(service.id)) {
        seen.add(service.id);
        services.push(service);
      }
    }

    return services;
  }

  /**
   * Get services by category
   */
  getServicesByCategory(category: string): BlockchainService[] {
    return this.getAllServices().filter(s => s.category === category);
  }

  /**
   * Get service by blockchain name
   */
  getServiceByBlockchain(blockchain: string, network: 'mainnet' | 'testnet' = 'mainnet'): BlockchainService | undefined {
    return this.services.get(`${blockchain}-${network}`);
  }

  /**
   * Get service by ID
   */
  getServiceById(id: string): BlockchainService | undefined {
    return this.services.get(id);
  }

  /**
   * Find method by natural language query
   */
  findMethodByQuery(query: string): { method: RPCMethod; service: BlockchainService }[] {
    const queryLower = query.toLowerCase();
    const results: { method: RPCMethod; service: BlockchainService }[] = [];

    // Check aliases first
    for (const [alias, methodNames] of this.methodAliases.entries()) {
      if (queryLower.includes(alias)) {
        for (const service of this.getAllServices()) {
          for (const method of service.supportedMethods) {
            if (methodNames.includes(method.name)) {
              results.push({ method, service });
            }
          }
        }
      }
    }

    // If no alias matches, search by method name and description
    if (results.length === 0) {
      for (const service of this.getAllServices()) {
        for (const method of service.supportedMethods) {
          const methodText = `${method.name} ${method.description}`.toLowerCase();
          if (methodText.includes(queryLower) || queryLower.includes(method.name.toLowerCase())) {
            results.push({ method, service });
          }
        }
      }
    }

    return results;
  }

  /**
   * Parse natural language query to extract blockchain and intent
   */
  parseQuery(query: string): {
    blockchain?: string;
    network?: 'mainnet' | 'testnet';
    intent: string;
  } {
    const queryLower = query.toLowerCase();

    // Extract blockchain
    let blockchain: string | undefined;
    const blockchainKeywords: Record<string, string[]> = {
      ethereum: ['ethereum', 'eth', 'ether'],
      polygon: ['polygon', 'matic'],
      arbitrum: ['arbitrum', 'arb'],
      optimism: ['optimism', 'op'],
      base: ['base'],
      bsc: ['bsc', 'binance', 'bnb'],
      avalanche: ['avalanche', 'avax'],
      solana: ['solana', 'sol'],
    };

    for (const [chain, keywords] of Object.entries(blockchainKeywords)) {
      if (keywords.some(kw => queryLower.includes(kw))) {
        blockchain = chain;
        break;
      }
    }

    // Extract network
    const network: 'mainnet' | 'testnet' = queryLower.includes('test') ? 'testnet' : 'mainnet';

    return { blockchain, network, intent: query };
  }

  /**
   * Call a JSON-RPC method
   */
  async callRPCMethod(
    serviceId: string,
    method: string,
    params: any[] = []
  ): Promise<EndpointResponse> {
    const service = this.getServiceById(serviceId);
    if (!service) {
      return {
        success: false,
        error: `Service not found: ${serviceId}`,
      };
    }

    try {
      const response = await fetch(service.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: 1,
        }),
      });

      // Handle HTTP errors (rate limiting, server errors, etc.)
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        // Common HTTP error interpretations
        if (response.status === 429) {
          errorMessage = `Rate limit exceeded (HTTP 429). Public endpoints have usage limits. Please try again later or use Grove Portal for higher limits.`;
        } else if (response.status === 503) {
          errorMessage = `Service temporarily unavailable (HTTP 503). The endpoint may be overloaded.`;
        } else if (response.status >= 500) {
          errorMessage = `Server error (HTTP ${response.status}). The RPC endpoint encountered an internal error.`;
        }

        return {
          success: false,
          error: errorMessage,
          data: {
            httpStatus: response.status,
            httpStatusText: response.statusText,
            responseBody: errorText.substring(0, 500), // Limit error body size
          },
          metadata: {
            timestamp: new Date().toISOString(),
            endpoint: service.rpcUrl,
          },
        };
      }

      const data = await response.json();

      // Handle JSON-RPC errors
      if (data.error) {
        return {
          success: false,
          error: data.error.message || 'RPC error',
          data: data.error,
          metadata: {
            timestamp: new Date().toISOString(),
            endpoint: service.rpcUrl,
          },
        };
      }

      return {
        success: true,
        data: data.result,
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: service.rpcUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
          errorStack: error instanceof Error ? error.stack : undefined,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: service.rpcUrl,
        },
      };
    }
  }

  /**
   * Execute a natural language query
   */
  async executeQuery(query: string): Promise<EndpointResponse> {
    const parsed = this.parseQuery(query);
    const matches = this.findMethodByQuery(parsed.intent);

    if (matches.length === 0) {
      return {
        success: false,
        error: `No matching methods found for query: "${query}"`,
      };
    }

    // Filter by blockchain if specified
    let filteredMatches = matches;
    if (parsed.blockchain) {
      filteredMatches = matches.filter(
        m => m.service.blockchain === parsed.blockchain
      );

      if (filteredMatches.length === 0) {
        filteredMatches = matches; // Fall back to all matches
      }
    }

    // Use the first match
    const { method, service } = filteredMatches[0];

    // Build params based on method requirements
    const params = this.buildParamsForMethod(method, query);

    return this.callRPCMethod(service.id, method.name, params);
  }

  /**
   * Build parameters for a method based on the query
   */
  private buildParamsForMethod(method: RPCMethod, query: string): any[] {
    const params: any[] = [];

    if (!method.params || method.params.length === 0) {
      return params;
    }

    // For simple queries like "get latest height", use defaults
    if (method.name === 'eth_getBlockByNumber' || method.name === 'getBlock') {
      if (query.toLowerCase().includes('latest')) {
        params.push('latest', false);
      }
    }

    // Add default params for required parameters
    for (const param of method.params) {
      if (param.required && param.default !== undefined) {
        params.push(param.default);
      }
    }

    return params;
  }

  /**
   * Get all supported methods for a service
   */
  getServiceMethods(serviceId: string): RPCMethod[] {
    const service = this.getServiceById(serviceId);
    return service?.supportedMethods || [];
  }

  /**
   * Get all unique categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const service of this.getAllServices()) {
      categories.add(service.category);
    }
    return Array.from(categories);
  }
}
