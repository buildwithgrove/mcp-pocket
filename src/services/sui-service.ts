import { EndpointResponse } from '../types.js';
import { BlockchainRPCService } from './blockchain-service.js';

/**
 * Sui blockchain service for objects, transactions, and accounts
 */
export class SuiService {
  private blockchainService: BlockchainRPCService;

  constructor(blockchainService: BlockchainRPCService) {
    this.blockchainService = blockchainService;
  }

  /**
   * Get SUI balance for an address
   */
  async getBalance(
    address: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('sui', network);

    if (!service) {
      return {
        success: false,
        error: `Sui service not found for ${network}`,
      };
    }

    const result = await this.blockchainService.callRPCMethod(
      service.id,
      'suix_getBalance',
      [address]
    );

    if (result.success && result.data) {
      // Add human-readable balance (SUI has 9 decimals)
      const totalBalance = BigInt(result.data.totalBalance || '0');
      const sui = Number(totalBalance) / 1e9;

      return {
        success: true,
        data: {
          address,
          totalBalance: result.data.totalBalance,
          sui,
          coinType: result.data.coinType || '0x2::sui::SUI',
        },
        metadata: result.metadata,
      };
    }

    return result;
  }

  /**
   * Get all coin balances for an address
   */
  async getAllBalances(
    address: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('sui', network);

    if (!service) {
      return {
        success: false,
        error: `Sui service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'suix_getAllBalances',
      [address]
    );
  }

  /**
   * Get coins owned by an address
   */
  async getCoins(
    address: string,
    coinType?: string,
    cursor?: string,
    limit?: number,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('sui', network);

    if (!service) {
      return {
        success: false,
        error: `Sui service not found for ${network}`,
      };
    }

    const params: any[] = [address];
    if (coinType) params.push(coinType);
    if (cursor) params.push(cursor);
    if (limit) params.push(limit);

    return this.blockchainService.callRPCMethod(service.id, 'suix_getCoins', params);
  }

  /**
   * Get object details by ID
   */
  async getObject(
    objectId: string,
    options?: {
      showType?: boolean;
      showOwner?: boolean;
      showPreviousTransaction?: boolean;
      showDisplay?: boolean;
      showContent?: boolean;
      showBcs?: boolean;
      showStorageRebate?: boolean;
    },
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('sui', network);

    if (!service) {
      return {
        success: false,
        error: `Sui service not found for ${network}`,
      };
    }

    const params: any[] = [objectId];
    if (options) {
      params.push({
        showType: options.showType,
        showOwner: options.showOwner,
        showPreviousTransaction: options.showPreviousTransaction,
        showDisplay: options.showDisplay,
        showContent: options.showContent,
        showBcs: options.showBcs,
        showStorageRebate: options.showStorageRebate,
      });
    }

    return this.blockchainService.callRPCMethod(service.id, 'sui_getObject', params);
  }

  /**
   * Get objects owned by an address
   */
  async getOwnedObjects(
    address: string,
    query?: {
      filter?: any;
      options?: any;
    },
    cursor?: string,
    limit?: number,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('sui', network);

    if (!service) {
      return {
        success: false,
        error: `Sui service not found for ${network}`,
      };
    }

    const params: any[] = [address];
    if (query) params.push(query);
    if (cursor) params.push(cursor);
    if (limit) params.push(limit);

    return this.blockchainService.callRPCMethod(service.id, 'suix_getOwnedObjects', params);
  }

  /**
   * Get transaction details by digest
   */
  async getTransaction(
    txDigest: string,
    options?: {
      showInput?: boolean;
      showEffects?: boolean;
      showEvents?: boolean;
      showObjectChanges?: boolean;
      showBalanceChanges?: boolean;
    },
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('sui', network);

    if (!service) {
      return {
        success: false,
        error: `Sui service not found for ${network}`,
      };
    }

    const params: any[] = [txDigest];
    if (options) {
      params.push({
        showInput: options.showInput ?? true,
        showEffects: options.showEffects ?? true,
        showEvents: options.showEvents ?? true,
        showObjectChanges: options.showObjectChanges,
        showBalanceChanges: options.showBalanceChanges,
      });
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'sui_getTransactionBlock',
      params
    );
  }

  /**
   * Query transactions
   */
  async queryTransactions(
    query: {
      filter?: any;
      options?: any;
    },
    cursor?: string,
    limit?: number,
    descendingOrder?: boolean,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('sui', network);

    if (!service) {
      return {
        success: false,
        error: `Sui service not found for ${network}`,
      };
    }

    const params: any[] = [query];
    if (cursor !== undefined) params.push(cursor);
    if (limit !== undefined) params.push(limit);
    if (descendingOrder !== undefined) params.push(descendingOrder);

    return this.blockchainService.callRPCMethod(
      service.id,
      'suix_queryTransactionBlocks',
      params
    );
  }

  /**
   * Get latest checkpoint sequence number
   */
  async getLatestCheckpoint(
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('sui', network);

    if (!service) {
      return {
        success: false,
        error: `Sui service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'sui_getLatestCheckpointSequenceNumber',
      []
    );
  }

  /**
   * Get checkpoint details
   */
  async getCheckpoint(
    checkpointId: string | number,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('sui', network);

    if (!service) {
      return {
        success: false,
        error: `Sui service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(service.id, 'sui_getCheckpoint', [checkpointId]);
  }

  /**
   * Get events by query
   */
  async queryEvents(
    query: any,
    cursor?: string,
    limit?: number,
    descendingOrder?: boolean,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('sui', network);

    if (!service) {
      return {
        success: false,
        error: `Sui service not found for ${network}`,
      };
    }

    const params: any[] = [query];
    if (cursor !== undefined) params.push(cursor);
    if (limit !== undefined) params.push(limit);
    if (descendingOrder !== undefined) params.push(descendingOrder);

    return this.blockchainService.callRPCMethod(service.id, 'suix_queryEvents', params);
  }

  /**
   * Get reference gas price
   */
  async getReferenceGasPrice(
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('sui', network);

    if (!service) {
      return {
        success: false,
        error: `Sui service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(service.id, 'suix_getReferenceGasPrice', []);
  }
}
