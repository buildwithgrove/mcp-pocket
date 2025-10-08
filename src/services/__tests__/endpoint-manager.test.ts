import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EndpointManager } from '../endpoint-manager.js';
import type { ServerConfig, EndpointConfig } from '../../types.js';

describe('EndpointManager', () => {
  let endpointManager: EndpointManager;
  let mockConfig: ServerConfig;

  beforeEach(() => {
    mockConfig = {
      baseUrls: {
        endpoints: 'https://api.example.com',
        docs: 'https://docs.example.com',
      },
      categories: ['blockchain', 'analytics', 'utility'],
      endpoints: [
        {
          id: 'get-balance',
          name: 'Get Balance',
          path: '/balance/:address',
          method: 'GET',
          description: 'Get wallet balance',
          category: 'blockchain',
          parameters: [
            {
              name: 'address',
              type: 'string',
              description: 'Wallet address',
              required: true,
            },
          ],
        },
        {
          id: 'get-transaction',
          name: 'Get Transaction',
          path: '/tx/:hash',
          method: 'GET',
          description: 'Get transaction details',
          category: 'blockchain',
        },
        {
          id: 'create-webhook',
          name: 'Create Webhook',
          path: '/webhooks',
          method: 'POST',
          description: 'Create a webhook',
          category: 'utility',
        },
        {
          id: 'get-analytics',
          name: 'Get Analytics',
          path: '/analytics',
          method: 'GET',
          description: 'Get analytics data',
          category: 'analytics',
        },
      ] as EndpointConfig[],
    };

    endpointManager = new EndpointManager(mockConfig);

    vi.restoreAllMocks();
  });

  describe('getAllEndpoints', () => {
    it('should return all configured endpoints', () => {
      const endpoints = endpointManager.getAllEndpoints();

      expect(endpoints).toHaveLength(4);
      expect(endpoints.map(e => e.id)).toContain('get-balance');
    });
  });

  describe('getEndpointsByCategory', () => {
    it('should filter endpoints by category', () => {
      const blockchainEndpoints = endpointManager.getEndpointsByCategory('blockchain');

      expect(blockchainEndpoints).toHaveLength(2);
      expect(blockchainEndpoints.every(e => e.category === 'blockchain')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const endpoints = endpointManager.getEndpointsByCategory('non-existent');

      expect(endpoints).toHaveLength(0);
    });
  });

  describe('getEndpointById', () => {
    it('should return endpoint by ID', () => {
      const endpoint = endpointManager.getEndpointById('get-balance');

      expect(endpoint).toBeDefined();
      expect(endpoint?.name).toBe('Get Balance');
    });

    it('should return undefined for non-existent ID', () => {
      const endpoint = endpointManager.getEndpointById('non-existent');

      expect(endpoint).toBeUndefined();
    });
  });

  describe('getCategories', () => {
    it('should return all categories', () => {
      const categories = endpointManager.getCategories();

      expect(categories).toEqual(['blockchain', 'analytics', 'utility']);
    });
  });

  describe('buildEndpointUrl', () => {
    it('should build URL without path params', () => {
      const url = endpointManager.buildEndpointUrl('get-analytics');

      expect(url).toBe('https://api.example.com/analytics');
    });

    it('should build URL with path params', () => {
      const url = endpointManager.buildEndpointUrl('get-balance', {
        address: '0x123abc',
      });

      expect(url).toBe('https://api.example.com/balance/0x123abc');
    });

    it('should replace multiple path params', () => {
      // Add endpoint with multiple params for this test
      mockConfig.endpoints.push({
        id: 'multi-param',
        name: 'Multi Param',
        path: '/users/:userId/posts/:postId',
        method: 'GET',
        description: 'Test endpoint',
        category: 'test',
      } as EndpointConfig);

      const manager = new EndpointManager(mockConfig);
      const url = manager.buildEndpointUrl('multi-param', {
        userId: '123',
        postId: '456',
      });

      expect(url).toBe('https://api.example.com/users/123/posts/456');
    });

    it('should throw error for non-existent endpoint', () => {
      expect(() => {
        endpointManager.buildEndpointUrl('non-existent');
      }).toThrow('Endpoint not found');
    });
  });

  describe('fetchEndpoint', () => {
    it('should fetch endpoint successfully', async () => {
      const mockResponse = { data: 'test' };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await endpointManager.fetchEndpoint('get-analytics');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(result.metadata?.endpoint).toContain('/analytics');
    });

    it('should fetch with path params', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ balance: '100' }),
      });

      const result = await endpointManager.fetchEndpoint('get-balance', {
        pathParams: { address: '0x123' },
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/balance/0x123'),
        expect.any(Object)
      );
    });

    it('should fetch with query params', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await endpointManager.fetchEndpoint('get-analytics', {
        queryParams: { limit: '10', offset: '0' },
      });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('limit=10');
      expect(callUrl).toContain('offset=0');
    });

    it('should send body with POST request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'webhook123' }),
      });

      const body = { url: 'https://example.com/hook', events: ['tx.created'] };

      await endpointManager.fetchEndpoint('create-webhook', {
        body,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('should not send body with GET request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await endpointManager.fetchEndpoint('get-analytics', {
        body: { test: 'data' },
      });

      const fetchOptions = (global.fetch as any).mock.calls[0][1];
      expect(fetchOptions.body).toBeUndefined();
    });

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      });

      const result = await endpointManager.fetchEndpoint('get-analytics');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });

    it('should handle network failures', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await endpointManager.fetchEndpoint('get-analytics');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should return error for non-existent endpoint', async () => {
      const result = await endpointManager.fetchEndpoint('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Endpoint not found');
    });
  });

  describe('addEndpoint', () => {
    it('should add new endpoint', () => {
      const newEndpoint: EndpointConfig = {
        id: 'new-endpoint',
        name: 'New Endpoint',
        path: '/new',
        method: 'GET',
        description: 'A new endpoint',
        category: 'blockchain',
      };

      endpointManager.addEndpoint(newEndpoint);

      const retrieved = endpointManager.getEndpointById('new-endpoint');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('New Endpoint');
    });

    it('should add category if it does not exist', () => {
      const newEndpoint: EndpointConfig = {
        id: 'new-endpoint',
        name: 'New Endpoint',
        path: '/new',
        method: 'GET',
        description: 'A new endpoint',
        category: 'new-category',
      };

      endpointManager.addEndpoint(newEndpoint);

      const categories = endpointManager.getCategories();
      expect(categories).toContain('new-category');
    });

    it('should throw error if endpoint ID already exists', () => {
      const duplicateEndpoint: EndpointConfig = {
        id: 'get-balance',
        name: 'Duplicate',
        path: '/duplicate',
        method: 'GET',
        description: 'Duplicate endpoint',
        category: 'blockchain',
      };

      expect(() => {
        endpointManager.addEndpoint(duplicateEndpoint);
      }).toThrow('already exists');
    });
  });
});
