import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedBlockchainService } from '../advanced-blockchain-service.js';
import { BlockchainRPCService } from '../blockchain-service.js';
import type { BlockchainService, RPCMethod } from '../../types.js';

describe('AdvancedBlockchainService', () => {
  let advancedService: AdvancedBlockchainService;
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
          rpcUrl: 'https://ethereum.rpc.grove.city/v1/test-app-id',
          protocol: 'json-rpc',
          category: 'evm',
          supportedMethods: [] as RPCMethod[],
        },
        {
          id: 'polygon-mainnet',
          name: 'Polygon Mainnet',
          blockchain: 'polygon',
          network: 'mainnet',
          rpcUrl: 'https://polygon.rpc.grove.city/v1/test-app-id',
          protocol: 'json-rpc',
          category: 'layer2',
          supportedMethods: [] as RPCMethod[],
        },
      ] as BlockchainService[],
    };

    mockBlockchainService = new BlockchainRPCService(mockServicesData);
    advancedService = new AdvancedBlockchainService(mockBlockchainService);

    vi.restoreAllMocks();
  });

  describe('getTokenBalance', () => {
    it('should get ERC-20 token balance successfully', async () => {
      const mockResponse = {
        success: true,
        data: '0x00000000000000000000000000000000000000000000000000000000000003e8',
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue(mockResponse);

      const result = await advancedService.getTokenBalance(
        'ethereum',
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.balance).toBe('1000');
      expect(result.data?.balanceHex).toBe('0x00000000000000000000000000000000000000000000000000000000000003e8');
    });

    it('should handle token balance call failure', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: false,
        error: 'RPC call failed',
      });

      const result = await advancedService.getTokenBalance(
        'ethereum',
        '0xToken',
        '0xWallet',
        'mainnet'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('RPC call failed');
    });

    it('should return error for non-existent blockchain', async () => {
      const result = await advancedService.getTokenBalance(
        'non-existent-chain',
        '0xToken',
        '0xWallet'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Blockchain service not found');
    });
  });

  describe('getTokenMetadata', () => {
    it('should fetch token metadata successfully', async () => {
      const mockDecimals = '0x0000000000000000000000000000000000000000000000000000000000000006';
      const mockSymbol = '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000455534443000000000000000000000000000000000000000000000000000000000';
      const mockName = '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000009555344436f696e000000000000000000000000000000000000000000000000000';
      const mockSupply = '0x000000000000000000000000000000000000000000000000000000174876e800';

      vi.spyOn(mockBlockchainService, 'callRPCMethod')
        .mockResolvedValueOnce({ success: true, data: mockDecimals })
        .mockResolvedValueOnce({ success: true, data: mockSymbol })
        .mockResolvedValueOnce({ success: true, data: mockName })
        .mockResolvedValueOnce({ success: true, data: mockSupply });

      const result = await advancedService.getTokenMetadata(
        'ethereum',
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
      );

      expect(result.success).toBe(true);
      expect(result.data?.decimals).toBe(6);
      expect(result.data?.symbol).toBe('USDC');
      expect(result.data?.name).toContain('USDCoin'); // May have null bytes
    });

    it('should return error for non-existent blockchain', async () => {
      const result = await advancedService.getTokenMetadata(
        'non-existent-chain',
        '0xToken'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Blockchain service not found');
    });
  });

  describe('compareBalances', () => {
    it('should compare balances across multiple chains', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod')
        .mockResolvedValueOnce({
          success: true,
          data: '0x0de0b6b3a7640000', // 1 ETH
        })
        .mockResolvedValueOnce({
          success: true,
          data: '0x1bc16d674ec80000', // 2 ETH
        });

      const result = await advancedService.compareBalances(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        ['ethereum', 'polygon'],
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.balances).toHaveLength(2);
      expect(result.data?.totalBalance).toBeCloseTo(3, 1);
      expect(result.data?.chainsWithBalance).toBe(2);
    });

    it('should handle errors in some chains gracefully', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod')
        .mockResolvedValueOnce({
          success: true,
          data: '0x0de0b6b3a7640000', // 1 ETH
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'Chain unavailable',
        });

      const result = await advancedService.compareBalances(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        ['ethereum', 'polygon'],
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.balances).toHaveLength(2);
      expect(result.data?.balances[1].error).toBe('Chain unavailable');
    });
  });

  describe('convertUnits', () => {
    it('should convert wei to gwei', () => {
      const result = advancedService.convertUnits('1000000000', 'wei', 'gwei');
      expect(result.success).toBe(true);
      expect(result.data?.value).toBe('1');
      expect(result.data?.exact).toBe(true);
    });

    it('should convert gwei to eth', () => {
      const result = advancedService.convertUnits('1000000000', 'gwei', 'eth');
      expect(result.success).toBe(true);
      expect(result.data?.value).toBe('1');
      expect(result.data?.exact).toBe(true);
    });

    it('should convert wei to eth', () => {
      const result = advancedService.convertUnits('1000000000000000000', 'wei', 'eth');
      expect(result.success).toBe(true);
      expect(result.data?.value).toBe('1');
      expect(result.data?.exact).toBe(true);
    });

    it('should handle inexact conversions', () => {
      const result = advancedService.convertUnits('1500000000', 'wei', 'gwei');
      expect(result.success).toBe(true);
      expect(result.data?.value).toBe('1');
      expect(result.data?.exact).toBe(false);
    });

    it('should handle conversion errors', () => {
      const result = advancedService.convertUnits('invalid', 'wei', 'eth');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateAddress', () => {
    it('should validate EVM addresses', () => {
      const result = advancedService.validateAddress(
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
        'ethereum'
      );
      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(true);
      expect(result.data?.format).toContain('EVM');
    });

    it('should reject invalid EVM addresses', () => {
      const result = advancedService.validateAddress('0xinvalid', 'ethereum');
      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(false);
    });

    it('should reject addresses without 0x prefix', () => {
      const result = advancedService.validateAddress(
        '742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        'ethereum'
      );
      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(false);
    });

    it('should return error for non-existent blockchain', () => {
      const result = advancedService.validateAddress('0x123', 'non-existent-chain');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Blockchain service not found');
    });
  });

  describe('decodeHex', () => {
    it('should decode hex to UTF-8', () => {
      const result = advancedService.decodeHex('0x48656c6c6f');
      expect(result.success).toBe(true);
      expect(result.data?.utf8).toBe('Hello');
      expect(result.data?.length).toBe(5);
    });

    it('should handle hex without 0x prefix', () => {
      const result = advancedService.decodeHex('48656c6c6f');
      expect(result.success).toBe(true);
      expect(result.data?.utf8).toBe('Hello');
    });

    it('should include byte array in result', () => {
      const result = advancedService.decodeHex('0x48656c6c6f');
      expect(result.success).toBe(true);
      expect(result.data?.bytes).toEqual([72, 101, 108, 108, 111]);
    });

    it('should decode invalid hex gracefully', () => {
      // Invalid hex doesn't throw error in Buffer.from, it just produces garbled output
      const result = advancedService.decodeHex('0xZZ');
      expect(result.success).toBe(true);
      // Just verify the decode function runs without errors
    });
  });

  describe('getTransaction', () => {
    it('should get transaction details for EVM chains', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: { hash: '0x123', from: '0xabc' },
      });

      const result = await advancedService.getTransaction(
        'ethereum',
        '0x123abc',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        expect.any(String),
        'eth_getTransactionByHash',
        ['0x123abc'],
        undefined
      );
    });

    it('should return error for non-existent blockchain', async () => {
      const result = await advancedService.getTransaction(
        'non-existent',
        '0x123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Blockchain service not found');
    });
  });

  describe('getGasPrice', () => {
    it('should get gas price and convert to gwei', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: '0x3b9aca00', // 1 gwei in hex
      });

      const result = await advancedService.getGasPrice('ethereum', 'mainnet');

      expect(result.success).toBe(true);
      expect(result.data?.gasPrice).toBe(1);
      expect(result.data?.gasPriceWei).toBe('1000000000');
    });
  });

  describe('searchLogs', () => {
    it('should search event logs', async () => {
      const mockLogs = [
        { address: '0x123', topics: ['0xabc'], data: '0xdef' },
      ];

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockLogs,
      });

      const result = await advancedService.searchLogs(
        'ethereum',
        {
          fromBlock: '0x0',
          toBlock: 'latest',
          address: '0x123',
        },
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLogs);
    });
  });

  describe('getBlockDetails', () => {
    it('should get block details with string block number', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: { number: '0x123', hash: '0xabc' },
      });

      const result = await advancedService.getBlockDetails(
        'ethereum',
        'latest',
        false,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        expect.any(String),
        'eth_getBlockByNumber',
        ['latest', false],
        undefined
      );
    });

    it('should convert numeric block number to hex', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: { number: '0x10' },
      });

      await advancedService.getBlockDetails('ethereum', 16, true, 'mainnet');

      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        expect.any(String),
        'eth_getBlockByNumber',
        ['0x10', true],
        undefined
      );
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas for transaction', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: '0x5208', // 21000 in hex
      });

      const result = await advancedService.estimateGas(
        'ethereum',
        { from: '0x123', to: '0x456', value: '0x0' },
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('0x5208');
    });
  });

  describe('getTransactionReceipt', () => {
    it('should get transaction receipt', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: { status: '0x1', gasUsed: '0x5208' },
      });

      const result = await advancedService.getTransactionReceipt(
        'ethereum',
        '0x123abc',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('0x1');
    });
  });

  describe('getHistoricalBalance', () => {
    it('should get balance at specific block', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: '0x0de0b6b3a7640000', // 1 ETH
      });

      const result = await advancedService.getHistoricalBalance(
        'ethereum',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        1000,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.balance).toBeCloseTo(1, 1);
      expect(result.data?.blockNumber).toBe('0x3e8');
    });
  });

  describe('callContractView', () => {
    it('should call contract view function', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: '0x0000000000000000000000000000000000000000000000000000000000000001',
      });

      const result = await advancedService.callContractView(
        'ethereum',
        '0x123',
        '0xabcdef',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        expect.any(String),
        'eth_call',
        expect.arrayContaining([
          expect.objectContaining({ to: '0x123', data: '0xabcdef' }),
        ]),
        undefined
      );
    });
  });
});
