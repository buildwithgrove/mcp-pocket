import { EndpointResponse } from '../types.js';
import { BlockchainRPCService } from './blockchain-service.js';

/**
 * Solana-specific blockchain service for SPL tokens, accounts, and transactions
 */
export class SolanaService {
  private blockchainService: BlockchainRPCService;

  // SPL Token Program ID
  private static readonly TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

  constructor(blockchainService: BlockchainRPCService) {
    this.blockchainService = blockchainService;
  }

  /**
   * Get SPL token balance for a wallet address
   */
  async getTokenBalance(
    walletAddress: string,
    mintAddress?: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('solana', network);

    if (!service) {
      return {
        success: false,
        error: `Solana service not found for ${network}`,
      };
    }

    try {
      // Get all token accounts for the wallet
      const params = mintAddress
        ? [
            walletAddress,
            {
              mint: mintAddress,
            },
            {
              encoding: 'jsonParsed',
            },
          ]
        : [
            walletAddress,
            {
              programId: SolanaService.TOKEN_PROGRAM_ID,
            },
            {
              encoding: 'jsonParsed',
            },
          ];

      const result = await this.blockchainService.callRPCMethod(
        service.id,
        'getTokenAccountsByOwner',
        params,
        appId
      );

      if (!result.success) {
        return result;
      }

      const accounts = result.data?.value || [];

      if (mintAddress) {
        // Return specific token balance
        if (accounts.length === 0) {
          return {
            success: true,
            data: {
              mint: mintAddress,
              owner: walletAddress,
              balance: '0',
              decimals: 0,
            },
            metadata: result.metadata,
          };
        }

        const account = accounts[0];
        const tokenAmount = account.account?.data?.parsed?.info?.tokenAmount;

        return {
          success: true,
          data: {
            mint: mintAddress,
            owner: walletAddress,
            balance: tokenAmount?.amount || '0',
            uiAmount: tokenAmount?.uiAmount || 0,
            decimals: tokenAmount?.decimals || 0,
          },
          metadata: result.metadata,
        };
      } else {
        // Return all token balances
        const balances = accounts.map((account: any) => {
          const info = account.account?.data?.parsed?.info;
          const tokenAmount = info?.tokenAmount;

          return {
            mint: info?.mint,
            balance: tokenAmount?.amount || '0',
            uiAmount: tokenAmount?.uiAmount || 0,
            decimals: tokenAmount?.decimals || 0,
          };
        });

        return {
          success: true,
          data: {
            owner: walletAddress,
            tokens: balances,
            count: balances.length,
          },
          metadata: result.metadata,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Solana token balance',
      };
    }
  }

  /**
   * Get SPL token metadata
   */
  async getTokenMetadata(
    mintAddress: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('solana', network);

    if (!service) {
      return {
        success: false,
        error: `Solana service not found for ${network}`,
      };
    }

    try {
      // Get account info for the mint
      const result = await this.blockchainService.callRPCMethod(
        service.id,
        'getAccountInfo',
        [
          mintAddress,
          {
            encoding: 'jsonParsed',
          },
        ],
        appId
      );

      if (!result.success || !result.data?.value) {
        return {
          success: false,
          error: 'Token mint not found or invalid',
        };
      }

      const mintInfo = result.data.value.data?.parsed?.info;

      if (!mintInfo) {
        return {
          success: false,
          error: 'Invalid token mint data',
        };
      }

      return {
        success: true,
        data: {
          mint: mintAddress,
          decimals: mintInfo.decimals,
          supply: mintInfo.supply,
          mintAuthority: mintInfo.mintAuthority,
          freezeAuthority: mintInfo.freezeAuthority,
          isInitialized: mintInfo.isInitialized,
        },
        metadata: result.metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Solana token metadata',
      };
    }
  }

  /**
   * Get SOL balance for an address
   */
  async getBalance(
    address: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('solana', network);

    if (!service) {
      return {
        success: false,
        error: `Solana service not found for ${network}`,
      };
    }

    const result = await this.blockchainService.callRPCMethod(
      service.id,
      'getBalance',
      [address],
      appId
    );

    if (result.success && result.data?.value !== undefined) {
      const lamports = result.data.value;
      const sol = lamports / 1e9; // 1 SOL = 1 billion lamports

      return {
        success: true,
        data: {
          address,
          lamports,
          sol,
        },
        metadata: result.metadata,
      };
    }

    return result;
  }

  /**
   * Get account info
   */
  async getAccountInfo(
    address: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('solana', network);

    if (!service) {
      return {
        success: false,
        error: `Solana service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'getAccountInfo',
      [
        address,
        {
          encoding: 'jsonParsed',
        },
      ],
      appId
    );
  }

  /**
   * Get block with transactions
   */
  async getBlock(
    slot: number,
    includeTransactions: boolean = false,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('solana', network);

    if (!service) {
      return {
        success: false,
        error: `Solana service not found for ${network}`,
      };
    }

    const params: any = [
      slot,
      {
        encoding: 'json',
        transactionDetails: includeTransactions ? 'full' : 'signatures',
        maxSupportedTransactionVersion: 0,
      },
    ];

    return this.blockchainService.callRPCMethod(service.id, 'getBlock', params, appId);
  }

  /**
   * Get transaction with full details
   */
  async getTransaction(
    signature: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('solana', network);

    if (!service) {
      return {
        success: false,
        error: `Solana service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'getTransaction',
      [
        signature,
        {
          encoding: 'jsonParsed',
          maxSupportedTransactionVersion: 0,
        },
      ],
      appId
    );
  }

  /**
   * Get recent prioritization fees (for fee estimation)
   */
  async getRecentPrioritizationFees(
    addresses?: string[],
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('solana', network);

    if (!service) {
      return {
        success: false,
        error: `Solana service not found for ${network}`,
      };
    }

    const params = addresses ? [addresses] : [];

    return this.blockchainService.callRPCMethod(
      service.id,
      'getRecentPrioritizationFees',
      params,
      appId
    );
  }

  /**
   * Get fee for a message (transaction fee estimation)
   */
  async getFeeForMessage(
    message: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('solana', network);

    if (!service) {
      return {
        success: false,
        error: `Solana service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'getFeeForMessage',
      [message],
      appId
    );
  }

  /**
   * Get signatures for an address (transaction history)
   */
  async getSignaturesForAddress(
    address: string,
    limit: number = 10,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('solana', network);

    if (!service) {
      return {
        success: false,
        error: `Solana service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'getSignaturesForAddress',
      [
        address,
        {
          limit,
        },
      ],
      appId
    );
  }

  /**
   * Get latest block height
   */
  async getBlockHeight(
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('solana', network);

    if (!service) {
      return {
        success: false,
        error: `Solana service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(service.id, 'getBlockHeight', [], appId);
  }

  /**
   * Get program accounts (useful for finding all accounts owned by a program)
   */
  async getProgramAccounts(
    programId: string,
    filters?: any[],
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('solana', network);

    if (!service) {
      return {
        success: false,
        error: `Solana service not found for ${network}`,
      };
    }

    const params: any = [
      programId,
      {
        encoding: 'jsonParsed',
      },
    ];

    if (filters && filters.length > 0) {
      params[1].filters = filters;
    }

    return this.blockchainService.callRPCMethod(service.id, 'getProgramAccounts', params, appId);
  }
}
