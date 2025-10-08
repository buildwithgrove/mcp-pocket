import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SolanaService } from '../solana-service.js';
import { BlockchainRPCService } from '../blockchain-service.js';
import type { BlockchainService, RPCMethod } from '../../types.js';

describe('SolanaService', () => {
  let solanaService: SolanaService;
  let mockBlockchainService: BlockchainRPCService;

  beforeEach(() => {
    const mockServicesData = {
      methodAliases: {},
      services: [
        {
          id: 'solana-mainnet',
          name: 'Solana Mainnet',
          blockchain: 'solana',
          network: 'mainnet',
          rpcUrl: 'https://solana.rpc.grove.city/v1/test-app-id',
          protocol: 'json-rpc',
          category: 'layer1',
          supportedMethods: [] as RPCMethod[],
        },
      ] as BlockchainService[],
    };

    mockBlockchainService = new BlockchainRPCService(mockServicesData);
    solanaService = new SolanaService(mockBlockchainService);

    vi.restoreAllMocks();
  });

  describe('getBalance', () => {
    it('should get SOL balance successfully', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: {
          value: 1000000000, // 1 SOL
        },
      });

      const result = await solanaService.getBalance(
        'So11111111111111111111111111111111111111112',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.lamports).toBe(1000000000);
      expect(result.data?.sol).toBe(1);
    });

    it('should handle zero balance', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: {
          value: 0,
        },
      });

      const result = await solanaService.getBalance(
        'So11111111111111111111111111111111111111112'
      );

      expect(result.success).toBe(true);
      expect(result.data?.lamports).toBe(0);
      expect(result.data?.sol).toBe(0);
    });

    it('should return error for non-existent network', async () => {
      const result = await solanaService.getBalance(
        'So11111111111111111111111111111111111111112',
        'testnet' as any
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Solana service not found');
    });
  });

  describe('getTokenBalance', () => {
    it('should get specific SPL token balance', async () => {
      const mockResponse = {
        success: true,
        data: {
          value: [
            {
              account: {
                data: {
                  parsed: {
                    info: {
                      tokenAmount: {
                        amount: '1000000',
                        uiAmount: 1.0,
                        decimals: 6,
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue(mockResponse);

      const result = await solanaService.getTokenBalance(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.balance).toBe('1000000');
      expect(result.data?.uiAmount).toBe(1.0);
      expect(result.data?.decimals).toBe(6);
    });

    it('should return zero balance when no token account exists', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: {
          value: [],
        },
      });

      const result = await solanaService.getTokenBalance(
        'So11111111111111111111111111111111111111112',
        'TokenMintAddress',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.balance).toBe('0');
      expect(result.data?.decimals).toBe(0);
    });

    it('should get all SPL token balances', async () => {
      const mockResponse = {
        success: true,
        data: {
          value: [
            {
              account: {
                data: {
                  parsed: {
                    info: {
                      mint: 'TokenMint1',
                      tokenAmount: {
                        amount: '1000000',
                        uiAmount: 1.0,
                        decimals: 6,
                      },
                    },
                  },
                },
              },
            },
            {
              account: {
                data: {
                  parsed: {
                    info: {
                      mint: 'TokenMint2',
                      tokenAmount: {
                        amount: '2000000',
                        uiAmount: 2.0,
                        decimals: 6,
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue(mockResponse);

      const result = await solanaService.getTokenBalance(
        'So11111111111111111111111111111111111111112',
        undefined,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.tokens).toHaveLength(2);
      expect(result.data?.count).toBe(2);
    });
  });

  describe('getTransaction', () => {
    it('should get transaction details', async () => {
      const mockTx = {
        slot: 123456,
        transaction: {
          message: {},
          signatures: ['sig1'],
        },
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockTx,
      });

      const result = await solanaService.getTransaction(
        '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTx);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'solana-mainnet',
        'getTransaction',
        expect.any(Array)
      );
    });
  });

  describe('getBlockHeight', () => {
    it('should get current block height', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: 123456789,
      });

      const result = await solanaService.getBlockHeight('mainnet');

      expect(result.success).toBe(true);
      expect(result.data).toBe(123456789);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'solana-mainnet',
        'getBlockHeight',
        []
      );
    });
  });

  describe('getTokenMetadata', () => {
    it('should get SPL token metadata', async () => {
      const mockMetadata = {
        value: {
          data: {
            parsed: {
              info: {
                decimals: 6,
                supply: '1000000000',
                mintAuthority: 'AuthorityAddress',
                freezeAuthority: null,
                isInitialized: true,
              },
            },
          },
        },
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockMetadata,
      });

      const result = await solanaService.getTokenMetadata(
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.decimals).toBe(6);
      expect(result.data?.supply).toBe('1000000000');
      expect(result.data?.isInitialized).toBe(true);
    });

    it('should handle invalid token mint', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: {
          value: null,
        },
      });

      const result = await solanaService.getTokenMetadata('InvalidMint', 'mainnet');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Token mint not found');
    });
  });

  describe('getAccountInfo', () => {
    it('should get account information', async () => {
      const mockAccount = {
        lamports: 1000000,
        owner: 'OwnerProgramId',
        data: 'base64data',
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockAccount,
      });

      const result = await solanaService.getAccountInfo(
        'So11111111111111111111111111111111111111112',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'solana-mainnet',
        'getAccountInfo',
        expect.any(Array)
      );
    });
  });

  describe('getBlock', () => {
    it('should get block with transactions', async () => {
      const mockBlock = {
        blockhash: 'hash123',
        previousBlockhash: 'hash122',
        transactions: [],
      };

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockBlock,
      });

      const result = await solanaService.getBlock(123456, true, 'mainnet');

      expect(result.success).toBe(true);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'solana-mainnet',
        'getBlock',
        expect.arrayContaining([
          123456,
          expect.objectContaining({
            transactionDetails: 'full',
          }),
        ])
      );
    });

    it('should get block without full transactions', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: {},
      });

      await solanaService.getBlock(123456, false, 'mainnet');

      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'solana-mainnet',
        'getBlock',
        expect.arrayContaining([
          123456,
          expect.objectContaining({
            transactionDetails: 'signatures',
          }),
        ])
      );
    });
  });

  describe('getRecentPrioritizationFees', () => {
    it('should get recent prioritization fees', async () => {
      const mockFees = [
        { slot: 123, prioritizationFee: 5000 },
        { slot: 124, prioritizationFee: 6000 },
      ];

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockFees,
      });

      const result = await solanaService.getRecentPrioritizationFees(
        undefined,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockFees);
    });

    it('should get fees for specific addresses', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: [],
      });

      await solanaService.getRecentPrioritizationFees(
        ['Address1', 'Address2'],
        'mainnet'
      );

      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'solana-mainnet',
        'getRecentPrioritizationFees',
        [['Address1', 'Address2']]
      );
    });
  });

  describe('getFeeForMessage', () => {
    it('should get fee for a message', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: { value: 5000 },
      });

      const result = await solanaService.getFeeForMessage(
        'base64EncodedMessage',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'solana-mainnet',
        'getFeeForMessage',
        ['base64EncodedMessage']
      );
    });
  });

  describe('getSignaturesForAddress', () => {
    it('should get transaction signatures for address', async () => {
      const mockSignatures = [
        { signature: 'sig1', slot: 123 },
        { signature: 'sig2', slot: 124 },
      ];

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockSignatures,
      });

      const result = await solanaService.getSignaturesForAddress(
        'So11111111111111111111111111111111111111112',
        10,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSignatures);
      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'solana-mainnet',
        'getSignaturesForAddress',
        expect.arrayContaining([
          'So11111111111111111111111111111111111111112',
          expect.objectContaining({ limit: 10 }),
        ])
      );
    });
  });

  describe('getProgramAccounts', () => {
    it('should get program accounts without filters', async () => {
      const mockAccounts = [
        { pubkey: 'Account1', account: {} },
        { pubkey: 'Account2', account: {} },
      ];

      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: mockAccounts,
      });

      const result = await solanaService.getProgramAccounts(
        'ProgramId',
        undefined,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAccounts);
    });

    it('should get program accounts with filters', async () => {
      vi.spyOn(mockBlockchainService, 'callRPCMethod').mockResolvedValue({
        success: true,
        data: [],
      });

      const filters = [{ memcmp: { offset: 0, bytes: 'base58data' } }];

      await solanaService.getProgramAccounts('ProgramId', filters, 'mainnet');

      expect(mockBlockchainService.callRPCMethod).toHaveBeenCalledWith(
        'solana-mainnet',
        'getProgramAccounts',
        expect.arrayContaining([
          'ProgramId',
          expect.objectContaining({
            filters,
          }),
        ])
      );
    });
  });
});
