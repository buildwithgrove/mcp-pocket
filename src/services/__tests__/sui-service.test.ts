import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuiService } from '../sui-service.js';
import { BlockchainRPCService } from '../blockchain-service.js';
import type { BlockchainService, RPCMethod } from '../../types.js';

describe('SuiService', () => {
  let suiService: SuiService;
  let mockBlockchainService: BlockchainRPCService;

  beforeEach(() => {
    const mockServicesData = {
      methodAliases: {},
      services: [
        {
          id: 'sui-mainnet',
          name: 'Sui Mainnet',
          blockchain: 'sui',
          network: 'mainnet',
          rpcUrl: 'https://sui.rpc.grove.city/v1/test-app-id',
          protocol: 'json-rpc',
          category: 'layer1',
          supportedMethods: [] as RPCMethod[],
        },
      ] as BlockchainService[],
    };

    mockBlockchainService = new BlockchainRPCService(mockServicesData);
    suiService = new SuiService(mockBlockchainService);

    vi.restoreAllMocks();
  });

  describe('getBalance', () => {
    it('should get SUI balance successfully', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: {
          totalBalance: '1000000000', // 1 SUI
          coinType: '0x2::sui::SUI',
        },
      });

      const result = await suiService.getBalance(
        '0xsuiaddress123',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.totalBalance).toBe('1000000000');
      expect(result.data?.sui).toBe(1);
      expect(result.data?.coinType).toBe('0x2::sui::SUI');
    });

    it('should handle zero balance', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: {
          totalBalance: '0',
          coinType: '0x2::sui::SUI',
        },
      });

      const result = await suiService.getBalance('0xsuiaddress123', 'mainnet');

      expect(result.success).toBe(true);
      expect(result.data?.sui).toBe(0);
    });

    it('should return error for non-existent network', async () => {
      const result = await suiService.getBalance('0xaddress', 'testnet' as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sui service not found');
    });
  });

  describe('getAllBalances', () => {
    it('should get all coin balances', async () => {
      const mockBalances = [
        { coinType: '0x2::sui::SUI', totalBalance: '1000000000' },
        { coinType: '0x2::coin::COIN', totalBalance: '500000000' },
      ];

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockBalances,
      });

      const result = await suiService.getAllBalances('0xaddress', 'mainnet');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBalances);
    });
  });

  describe('getCoins', () => {
    it('should get coins without filters', async () => {
      const mockCoins = {
        data: [
          {
            coinType: '0x2::sui::SUI',
            balance: '1000000',
          },
        ],
        nextCursor: null,
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockCoins,
      });

      const result = await suiService.getCoins('0xaddress', undefined, undefined, undefined, 'mainnet');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCoins);
    });

    it('should get coins with filters', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: { data: [] },
      });

      await suiService.getCoins(
        '0xaddress',
        '0x2::sui::SUI',
        'cursor123',
        10,
        'mainnet'
      );

      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'sui-mainnet',
        'suix_getCoins',
        ['0xaddress', '0x2::sui::SUI', 'cursor123', 10],
        undefined
      );
    });
  });

  describe('getObject', () => {
    it('should get object details with options', async () => {
      const mockObject = {
        data: {
          objectId: '0xobject123',
          version: '1',
          type: '0x2::coin::Coin',
        },
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockObject,
      });

      const result = await suiService.getObject(
        '0xobject123',
        {
          showType: true,
          showOwner: true,
          showContent: true,
        },
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockObject);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'sui-mainnet',
        'sui_getObject',
        expect.arrayContaining([
          '0xobject123',
          expect.objectContaining({
            showType: true,
            showOwner: true,
            showContent: true,
          }),
        ]),
        undefined
      );
    });

    it('should get object without options', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: {},
      });

      await suiService.getObject('0xobject123', undefined, 'mainnet');

      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'sui-mainnet',
        'sui_getObject',
        ['0xobject123'],
        undefined
      );
    });
  });

  describe('getOwnedObjects', () => {
    it('should get owned objects with query', async () => {
      const mockObjects = {
        data: [
          { data: { objectId: '0xobj1' } },
          { data: { objectId: '0xobj2' } },
        ],
        nextCursor: null,
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockObjects,
      });

      const result = await suiService.getOwnedObjects(
        '0xaddress',
        { filter: { StructType: '0x2::coin::Coin' } },
        undefined,
        10,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockObjects);
    });
  });

  describe('getTransaction', () => {
    it('should get transaction with options', async () => {
      const mockTx = {
        digest: 'TxDigest123',
        effects: {
          status: { status: 'success' },
        },
        events: [],
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockTx,
      });

      const result = await suiService.getTransaction(
        'TxDigest123',
        {
          showInput: true,
          showEffects: true,
          showEvents: true,
        },
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTx);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'sui-mainnet',
        'sui_getTransactionBlock',
        expect.arrayContaining([
          'TxDigest123',
          expect.objectContaining({
            showInput: true,
            showEffects: true,
            showEvents: true,
          }),
        ]),
        undefined
      );
    });

    it('should use default options when not provided', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: {},
      });

      await suiService.getTransaction('TxDigest123', undefined, 'mainnet');

      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'sui-mainnet',
        'sui_getTransactionBlock',
        ['TxDigest123'],
        undefined
      );
    });
  });

  describe('queryTransactions', () => {
    it('should query transactions with filters', async () => {
      const mockResult = {
        data: ['TxDigest1', 'TxDigest2'],
        nextCursor: null,
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockResult,
      });

      const result = await suiService.queryTransactions(
        {
          filter: { FromAddress: '0xaddress' },
        },
        undefined,
        10,
        true,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'sui-mainnet',
        'suix_queryTransactionBlocks',
        [
          expect.objectContaining({ filter: { FromAddress: '0xaddress' } }),
          10,
          true,
        ],
        undefined
      );
    });

    it('should handle minimal query params', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: { data: [] },
      });

      await suiService.queryTransactions({ filter: {} }, undefined, undefined, undefined, 'mainnet');

      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'sui-mainnet',
        'suix_queryTransactionBlocks',
        [{ filter: {} }],
        undefined
      );
    });
  });

  describe('getLatestCheckpoint', () => {
    it('should get latest checkpoint sequence number', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: '123456',
      });

      const result = await suiService.getLatestCheckpoint('mainnet');

      expect(result.success).toBe(true);
      expect(result.data).toBe('123456');
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'sui-mainnet',
        'sui_getLatestCheckpointSequenceNumber',
        [],
        undefined
      );
    });
  });

  describe('getCheckpoint', () => {
    it('should get checkpoint by string ID', async () => {
      const mockCheckpoint = {
        sequenceNumber: '123',
        digest: 'CheckpointDigest',
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockCheckpoint,
      });

      const result = await suiService.getCheckpoint('123', 'mainnet');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCheckpoint);
    });

    it('should get checkpoint by numeric ID', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: {},
      });

      await suiService.getCheckpoint(123, 'mainnet');

      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'sui-mainnet',
        'sui_getCheckpoint',
        [123],
        undefined
      );
    });
  });

  describe('queryEvents', () => {
    it('should query events with filters', async () => {
      const mockEvents = {
        data: [
          { id: { txDigest: 'TxDigest1' }, type: 'MoveEvent' },
        ],
        nextCursor: null,
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockEvents,
      });

      const result = await suiService.queryEvents(
        { MoveEventType: '0x2::coin::CoinCreated' },
        undefined,
        10,
        true,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEvents);
    });
  });

  describe('getReferenceGasPrice', () => {
    it('should get reference gas price', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: '1000',
      });

      const result = await suiService.getReferenceGasPrice('mainnet');

      expect(result.success).toBe(true);
      expect(result.data).toBe('1000');
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'sui-mainnet',
        'suix_getReferenceGasPrice',
        [],
        undefined
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service not found errors', async () => {
      const result = await suiService.getBalance('0xaddress', 'testnet' as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sui service not found');
    });

    it('should propagate RPC errors', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: false,
        error: 'RPC error occurred',
      });

      const result = await suiService.getBalance('0xaddress', 'mainnet');

      expect(result.success).toBe(false);
    });
  });
});
