/**
 * Configuration types for the MCP Grove server
 *
 * This server provides access to Grove's blockchain RPC endpoints:
 * - Default: Uses public endpoints (may be rate limited)
 * - Optional: Supports Grove Portal via GROVE_APP_ID for higher rate limits
 *
 * Get GROVE_APP_ID at portal.grove.city for production use.
 */

/**
 * Endpoint configuration for HTTP endpoints
 */
export interface EndpointConfig {
  /** Unique identifier for the endpoint */
  id: string;
  /** Human-readable name */
  name: string;
  /** URL path, supports params like /users/:id */
  path: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Description of what the endpoint does */
  description: string;
  /** Category for organization */
  category: string;
  /** Optional parameter definitions */
  parameters?: ParameterConfig[];
  // Blockchain-specific fields
  /** Blockchain identifier (e.g., 'ethereum', 'solana') */
  blockchain?: string;
  /** Network type */
  network?: 'mainnet' | 'testnet';
  /** Communication protocol */
  protocol?: 'json-rpc' | 'rest' | 'websocket';
  /** Supported RPC method names */
  rpcMethods?: string[];
  /** Alternative names for this endpoint */
  aliases?: string[];
}

/**
 * Parameter configuration for endpoints
 */
export interface ParameterConfig {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Description of the parameter */
  description: string;
  /** Whether the parameter is required */
  required: boolean;
  /** Default value if not provided */
  default?: any;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Base URLs for different services */
  baseUrls: {
    /** Base URL for HTTP endpoints */
    endpoints: string;
    /** Base URL for documentation */
    docs: string;
  };
  /** Array of configured endpoints */
  endpoints: EndpointConfig[];
  /** Available endpoint categories */
  categories: string[];
}

/**
 * Documentation page structure
 */
export interface DocPage {
  /** Page title */
  title: string;
  /** Page content (markdown or HTML) */
  content: string;
  /** URL of the page */
  url: string;
  /** Last update timestamp */
  lastUpdated?: string;
}

/**
 * Standard response format for endpoint calls
 */
export interface EndpointResponse {
  /** Whether the call succeeded */
  success: boolean;
  /** Response data (if successful) */
  data?: any;
  /** Error message (if failed) */
  error?: string;
  /** Additional metadata about the call */
  metadata?: {
    /** Timestamp of the call */
    timestamp: string;
    /** Endpoint that was called */
    endpoint: string;
  };
}

/**
 * Blockchain service configuration
 */
export interface BlockchainService {
  /** Unique identifier (e.g., 'ethereum-mainnet') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Blockchain identifier (e.g., 'ethereum') */
  blockchain: string;
  /** Network type */
  network: 'mainnet' | 'testnet';
  /** RPC endpoint URL */
  rpcUrl: string;
  /** Communication protocol */
  protocol: 'json-rpc' | 'rest' | 'websocket';
  /** Supported RPC methods */
  supportedMethods: RPCMethod[];
  /** Service category (e.g., 'evm', 'layer2', 'cosmos', 'non-evm') */
  category: string;
}

/**
 * RPC method definition
 */
export interface RPCMethod {
  /** Method name (e.g., 'eth_blockNumber') */
  name: string;
  /** Description of what the method does */
  description: string;
  /** Optional parameter definitions */
  params?: RPCParameter[];
  /** Example usage */
  example?: any;
  /** Method category for organization */
  category?: string;
}

/**
 * RPC method parameter definition
 */
export interface RPCParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Description of the parameter */
  description: string;
  /** Whether the parameter is required */
  required: boolean;
  /** Default value if not provided */
  default?: any;
}
