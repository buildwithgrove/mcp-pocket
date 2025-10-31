import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockchainRPCService } from '../blockchain-service.js';
import type { BlockchainService, RPCMethod } from '../../types.js';

describe('BlockchainRPCService', () => {
  let service: BlockchainRPCService;
  let mockServicesData: any;

  beforeEach(() => {
    // Mock services data
    mockServicesData = {
      methodAliases: {
        balance: ['eth_getBalance', 'getBalance'],
        'block height': ['eth_blockNumber', 'getBlockHeight'],
      },
      services: [
        {
          id: 'ethereum-mainnet',
          name: 'Ethereum Mainnet',
          blockchain: 'ethereum',
          network: 'mainnet',
          rpcUrl: 'https://eth.api.pocket.network',
          protocol: 'json-rpc',
          category: 'evm',
          supportedMethods: [
            {
              name: 'eth_getBalance',
              description: 'Get balance of an address',
              params: [
                { name: 'address', type: 'string', required: true },
                { name: 'block', type: 'string', required: true, default: 'latest' },
              ],
            },
            {
              name: 'eth_blockNumber',
              description: 'Get current block number',
              params: [],
            },
          ] as RPCMethod[],
        },
        {
          id: 'ethereum-foundation-mainnet',
          name: 'Ethereum Foundation Mainnet',
          blockchain: 'ethereum-foundation',
          network: 'mainnet',
          rpcUrl: 'https://eth.api.pocket.network',
          protocol: 'json-rpc',
          category: 'evm',
          supportedMethods: [
            {
              name: 'eth_getBalance',
              description: 'Get balance of an address',
              params: [],
            },
          ] as RPCMethod[],
        },
        {
          id: 'polygon-mainnet',
          name: 'Polygon Mainnet',
          blockchain: 'polygon',
          network: 'mainnet',
          rpcUrl: 'https://poly.api.pocket.network',
          protocol: 'json-rpc',
          category: 'layer2',
          supportedMethods: [
            {
              name: 'eth_getBalance',
              description: 'Get balance of an address',
              params: [],
            },
          ] as RPCMethod[],
        },
      ] as BlockchainService[],
    };

    service = new BlockchainRPCService(mockServicesData);

    // Reset fetch mock
    vi.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should index services by ID', () => {
      const ethereum = service.getServiceById('ethereum-mainnet');
      expect(ethereum).toBeDefined();
      // Note: Due to foundation preference, ethereum-mainnet key maps to ethereum-foundation service
      expect(ethereum?.blockchain).toBe('ethereum-foundation');
    });

    it('should prefer foundation endpoints when available', () => {
      const ethereum = service.getServiceByBlockchain('ethereum', 'mainnet');
      expect(ethereum).toBeDefined();
      expect(ethereum?.id).toBe('ethereum-foundation-mainnet');
    });

    it('should return all unique services', () => {
      const allServices = service.getAllServices();
      // Only 2 unique services (ethereum-foundation and polygon, ethereum is overridden)
      expect(allServices).toHaveLength(2);
    });
  });

  describe('getServicesByCategory', () => {
    it('should filter services by category', () => {
      const evmServices = service.getServicesByCategory('evm');
      // Only ethereum-foundation is in the unique services list (ethereum was overridden)
      expect(evmServices).toHaveLength(1);
      expect(evmServices.every(s => s.category === 'evm')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const services = service.getServicesByCategory('non-existent');
      expect(services).toHaveLength(0);
    });
  });

  describe('getServiceByBlockchain', () => {
    it('should get service by blockchain name', () => {
      const polygon = service.getServiceByBlockchain('polygon', 'mainnet');
      expect(polygon).toBeDefined();
      expect(polygon?.blockchain).toBe('polygon');
    });

    it('should return undefined for non-existent blockchain', () => {
      const result = service.getServiceByBlockchain('non-existent', 'mainnet');
      expect(result).toBeUndefined();
    });
  });

  describe('parseQuery', () => {
    it('should extract blockchain from query', () => {
      const result = service.parseQuery('get ethereum balance');
      expect(result.blockchain).toBe('ethereum');
      expect(result.network).toBe('mainnet');
    });

    it('should detect testnet in query', () => {
      const result = service.parseQuery('get polygon test balance');
      expect(result.blockchain).toBe('polygon');
      expect(result.network).toBe('testnet');
    });

    it('should handle queries without blockchain', () => {
      const result = service.parseQuery('get balance');
      expect(result.blockchain).toBeUndefined();
      expect(result.intent).toBe('get balance');
    });

    it('should recognize various blockchain aliases', () => {
      expect(service.parseQuery('eth balance').blockchain).toBe('ethereum');
      expect(service.parseQuery('matic balance').blockchain).toBe('polygon');
      expect(service.parseQuery('arb balance').blockchain).toBe('arbitrum');
    });
  });

  describe('findMethodByQuery', () => {
    it('should find methods by alias', () => {
      const results = service.findMethodByQuery('get balance');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.method.name === 'eth_getBalance')).toBe(true);
    });

    it('should find methods by method name', () => {
      const results = service.findMethodByQuery('eth_getBalance');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.method.name === 'eth_getBalance')).toBe(true);
    });

    it('should find methods by description', () => {
      const results = service.findMethodByQuery('Get balance');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = service.findMethodByQuery('nonexistent method xyz');
      expect(results).toHaveLength(0);
    });
  });

  describe('callRPCMethod - Success Cases', () => {
    it('should make successful RPC call', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: '0x1234567890abcdef',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.callRPCMethod('ethereum-mainnet', 'eth_getBalance', [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        'latest',
      ]);

      expect(result.success).toBe(true);
      expect(result.data).toBe('0x1234567890abcdef');
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.endpoint).toContain('eth.api.pocket.network');
    });


  });

  describe('callRPCMethod - Error Cases', () => {
    it('should handle service not found', async () => {
      const result = await service.callRPCMethod('non-existent-service', 'eth_blockNumber');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Service not found');
    });

    it('should handle HTTP 429 rate limit error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
      });

      const result = await service.callRPCMethod('ethereum-mainnet', 'eth_getBalance', [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.data?.httpStatus).toBe(429);
    });

    it('should handle HTTP 503 service unavailable', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => 'Service temporarily unavailable',
      });

      const result = await service.callRPCMethod('ethereum-mainnet', 'eth_blockNumber');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Service temporarily unavailable');
      expect(result.data?.httpStatus).toBe(503);
    });

    it('should handle HTTP 500 server error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Internal server error',
      });

      const result = await service.callRPCMethod('ethereum-mainnet', 'eth_blockNumber');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server error');
      expect(result.data?.httpStatus).toBe(500);
    });

    it('should handle JSON-RPC errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32602,
            message: 'Invalid params',
          },
        }),
      });

      const result = await service.callRPCMethod('ethereum-mainnet', 'eth_getBalance', ['invalid']);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid params');
      expect(result.data).toEqual({ code: -32602, message: 'Invalid params' });
    });

    it('should handle network failures', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.callRPCMethod('ethereum-mainnet', 'eth_blockNumber');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.data?.errorType).toBe('Error');
    });
  });

  describe('executeQuery', () => {
    it('should execute natural language query successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x123' }),
      });

      const result = await service.executeQuery('get ethereum balance');

      expect(result.success).toBe(true);
    });

    it('should return error for queries with no matches', async () => {
      const result = await service.executeQuery('completely unknown method xyz');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No matching methods found');
    });

    it('should filter by blockchain when specified', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x123' }),
      });

      const result = await service.executeQuery('get polygon balance');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('poly.api.pocket.network'),
        expect.any(Object)
      );
    });
  });

  describe('getServiceMethods', () => {
    it('should get methods for a service', () => {
      const methods = service.getServiceMethods('ethereum-foundation-mainnet');
      expect(methods).toHaveLength(1);
      expect(methods.map(m => m.name)).toContain('eth_getBalance');
    });

    it('should return empty array for non-existent service', () => {
      const methods = service.getServiceMethods('non-existent');
      expect(methods).toHaveLength(0);
    });
  });

  describe('getCategories', () => {
    it('should return all unique categories', () => {
      const categories = service.getCategories();
      expect(categories).toContain('evm');
      expect(categories).toContain('layer2');
      expect(categories.length).toBeGreaterThan(0);
    });
  });
});
