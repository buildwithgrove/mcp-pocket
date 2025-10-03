/**
 * Configuration types for the MCP Grove server
 */

export interface EndpointConfig {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  category: string;
  parameters?: ParameterConfig[];
  requiresAuth?: boolean;
  // Blockchain-specific fields
  blockchain?: string;
  network?: 'mainnet' | 'testnet';
  protocol?: 'json-rpc' | 'rest' | 'websocket';
  rpcMethods?: string[];
  aliases?: string[];
}

export interface ParameterConfig {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
}

export interface ServerConfig {
  baseUrls: {
    endpoints: string;
    docs: string;
  };
  endpoints: EndpointConfig[];
  categories: string[];
}

export interface DocPage {
  title: string;
  content: string;
  url: string;
  lastUpdated?: string;
}

export interface EndpointResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    timestamp: string;
    endpoint: string;
  };
}

export interface BlockchainService {
  id: string;
  name: string;
  blockchain: string;
  network: 'mainnet' | 'testnet';
  rpcUrl: string;
  protocol: 'json-rpc' | 'rest' | 'websocket';
  supportedMethods: RPCMethod[];
  category: string;
}

export interface RPCMethod {
  name: string;
  description: string;
  params?: RPCParameter[];
  example?: any;
  category?: string;
}

export interface RPCParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
}
