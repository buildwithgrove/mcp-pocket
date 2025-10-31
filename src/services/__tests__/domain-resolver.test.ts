import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DomainResolverService } from '../domain-resolver.js';
import { BlockchainRPCService } from '../blockchain-service.js';
import type { BlockchainService, RPCMethod } from '../../types.js';

describe('DomainResolverService', () => {
  let domainResolver: DomainResolverService;
  let mockBlockchainService: BlockchainRPCService;

  beforeEach(() => {
    const mockServicesData = {
      methodAliases: {},
      services: [
        {
          id: 'ethereum-mainnet',
          name: 'Ethereum Mainnet',
          blockchain: 'ethereum',
          network: 'mainnet',
          rpcUrl: 'https://eth.api.pocket.network',
          protocol: 'json-rpc',
          category: 'evm',
          supportedMethods: [] as RPCMethod[],
        },
        {
          id: 'polygon-mainnet',
          name: 'Polygon Mainnet',
          blockchain: 'polygon',
          network: 'mainnet',
          rpcUrl: 'https://poly.api.pocket.network',
          protocol: 'json-rpc',
          category: 'layer2',
          supportedMethods: [] as RPCMethod[],
        },
      ] as BlockchainService[],
    };

    mockBlockchainService = new BlockchainRPCService(mockServicesData);
    domainResolver = new DomainResolverService(mockBlockchainService);

    vi.restoreAllMocks();
  });

  describe('resolveDomain - ENS', () => {
    it('should resolve ENS domain successfully', async () => {
      // Mock resolver address call
      vi.spyOn(mockBlockchainService, 'callRPCMethod')
        .mockResolvedValueOnce({
          success: true,
          data: '0x000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63',
        })
        // Mock address resolution call
        .mockResolvedValueOnce({
          success: true,
          data: '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
        });

      const result = await domainResolver.resolveDomain('vitalik.eth');

      expect(result.success).toBe(true);
      expect(result.data?.domain).toBe('vitalik.eth');
      expect(result.data?.type).toBe('ENS');
      expect(result.data?.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should handle ENS domain with no resolver', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValueOnce({
        success: true,
        data: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });

      const result = await domainResolver.resolveDomain('nonexistent.eth');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No resolver set');
    });

    it('should handle ENS domain with no address set', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod')
        .mockResolvedValueOnce({
          success: true,
          data: '0x000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63',
        })
        .mockResolvedValueOnce({
          success: true,
          data: '0x0000000000000000000000000000000000000000000000000000000000000000',
        });

      const result = await domainResolver.resolveDomain('test.eth');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No address set');
    });

    it('should handle resolver lookup failure', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValueOnce({
        success: false,
        error: 'RPC error',
      });

      const result = await domainResolver.resolveDomain('test.eth');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get resolver');
    });
  });

  describe('resolveDomain - Unstoppable Domains', () => {
    it('should resolve Unstoppable Domain successfully', async () => {
      const mockAddress = '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000028307864386461366266323639363461663964376565643965303365353334313564333761613936303435000000000000000000000000000000000000000000000000';

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValueOnce({
        success: true,
        data: mockAddress,
      });

      const result = await domainResolver.resolveDomain('brad.crypto');

      expect(result.success).toBe(true);
      expect(result.data?.domain).toBe('brad.crypto');
      expect(result.data?.type).toBe('Unstoppable Domains');
    });

    it('should handle Unstoppable Domain with no address', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValueOnce({
        success: true,
        data: '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000',
      });

      const result = await domainResolver.resolveDomain('test.crypto');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No address set');
    });

    it('should recognize various Unstoppable Domain TLDs', async () => {
      const udTLDs = ['.crypto', '.nft', '.blockchain', '.bitcoin', '.wallet'];

      for (const tld of udTLDs) {
        vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValueOnce({
          success: false,
          error: 'test',
        });

        const result = await domainResolver.resolveDomain(`test${tld}`);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('resolveDomain - Unsupported', () => {
    it('should reject unsupported domain types', async () => {
      const result = await domainResolver.resolveDomain('test.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported domain type');
    });
  });

  describe('reverseResolve', () => {
    it('should reverse resolve ENS successfully', async () => {
      const mockNameData = '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000007746573742e6574680000000000000000000000000000000000000000000000000';

      vi.spyOn(mockBlockchainService, 'callRPCMethod')
        // Mock reverse name lookup
        .mockResolvedValueOnce({
          success: true,
          data: mockNameData,
        })
        // Mock forward resolution verification - resolver
        .mockResolvedValueOnce({
          success: true,
          data: '0x000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63',
        })
        // Mock forward resolution verification - address
        .mockResolvedValueOnce({
          success: true,
          data: '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
        });

      const result = await domainResolver.reverseResolve(
        '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
      );

      expect(result.success).toBe(true);
      expect(result.data?.address).toBe('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');
      expect(result.data?.type).toBe('ENS');
      expect(result.data?.verified).toBe(true);
    });

    it('should handle no reverse record', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValueOnce({
        success: false,
        error: 'No record',
      });

      const result = await domainResolver.reverseResolve('0x123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No reverse record');
    });

    it('should reject mismatched forward resolution', async () => {
      const mockNameData = '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000007746573742e6574680000000000000000000000000000000000000000000000000';

      vi.spyOn(mockBlockchainService, 'callRPCMethod')
        .mockResolvedValueOnce({
          success: true,
          data: mockNameData,
        })
        .mockResolvedValueOnce({
          success: true,
          data: '0x000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63',
        })
        .mockResolvedValueOnce({
          success: true,
          data: '0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff',
        });

      const result = await domainResolver.reverseResolve(
        '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('forward resolution mismatch');
    });
  });

  describe('getDomainRecords', () => {
    it('should get ENS text records', async () => {
      const mockEmailRecord = '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000d746573744074657374676d61696c2e636f6d000000000000000000000000000000';

      vi.spyOn(mockBlockchainService, 'callRPCMethod')
        // Resolver lookup
        .mockResolvedValueOnce({
          success: true,
          data: '0x000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63',
        })
        // Email record
        .mockResolvedValueOnce({
          success: true,
          data: mockEmailRecord,
        })
        // Twitter record
        .mockResolvedValueOnce({
          success: true,
          data: '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000',
        });

      const result = await domainResolver.getDomainRecords(
        'test.eth',
        ['email', 'com.twitter']
      );

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(2);
      expect(result.data?.records[0].key).toBe('email');
    });

    it('should reject non-ENS domains', async () => {
      const result = await domainResolver.getDomainRecords('test.com', ['email']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('only supported for ENS');
    });

    it('should handle resolver lookup failure', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValueOnce({
        success: false,
        error: 'Failed',
      });

      const result = await domainResolver.getDomainRecords('test.eth', ['email']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get resolver');
    });

    it('should handle no resolver set', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValueOnce({
        success: true,
        data: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });

      const result = await domainResolver.getDomainRecords('test.eth', ['email']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No resolver set');
    });
  });
});
