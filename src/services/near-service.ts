import { EndpointResponse } from '../types.js';
import { BlockchainRPCService } from './blockchain-service.js';

/**
 * NEAR Protocol blockchain service for accounts, transactions, and blocks
 */
export class NEARService {
  private blockchainService: BlockchainRPCService;

  constructor(blockchainService: BlockchainRPCService) {
    this.blockchainService = blockchainService;
  }

  /**
   * Get account details
   */
  async getAccount(
    accountId: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('near', network);

    if (!service) {
      return {
        success: false,
        error: `NEAR service not found for ${network}`,
      };
    }

    const result = await this.blockchainService.callRPCMethod(
      service.id,
      'query',
      {
        request_type: 'view_account',
        finality: 'final',
        account_id: accountId,
      },
      appId
    );

    if (result.success && result.data) {
      // Add human-readable balance (NEAR has 24 decimals: yoctoNEAR)
      const amount = result.data.amount ? BigInt(result.data.amount) : BigInt(0);
      const near = Number(amount) / 1e24;

      return {
        success: true,
        data: {
          accountId,
          amount: result.data.amount,
          near,
          locked: result.data.locked,
          codeHash: result.data.code_hash,
          storageUsage: result.data.storage_usage,
          storagePaidAt: result.data.storage_paid_at,
        },
        metadata: result.metadata,
      };
    }

    return result;
  }

  /**
   * View contract state
   */
  async viewContractState(
    accountId: string,
    prefix?: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('near', network);

    if (!service) {
      return {
        success: false,
        error: `NEAR service not found for ${network}`,
      };
    }

    const params: any = {
      request_type: 'view_state',
      finality: 'final',
      account_id: accountId,
    };

    if (prefix) {
      params.prefix_base64 = Buffer.from(prefix).toString('base64');
    }

    return this.blockchainService.callRPCMethod(service.id, 'query', params, appId);
  }

  /**
   * Call a view function on a contract
   */
  async callViewFunction(
    accountId: string,
    methodName: string,
    args: any = {},
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('near', network);

    if (!service) {
      return {
        success: false,
        error: `NEAR service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'query',
      {
        request_type: 'call_function',
        finality: 'final',
        account_id: accountId,
        method_name: methodName,
        args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      },
      appId
    );
  }

  /**
   * Get access keys for an account
   */
  async getAccessKeys(
    accountId: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('near', network);

    if (!service) {
      return {
        success: false,
        error: `NEAR service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'query',
      {
        request_type: 'view_access_key_list',
        finality: 'final',
        account_id: accountId,
      },
      appId
    );
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    txHash: string,
    senderAccountId: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('near', network);

    if (!service) {
      return {
        success: false,
        error: `NEAR service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'tx',
      [txHash, senderAccountId],
      appId
    );
  }

  /**
   * Get block details
   */
  async getBlock(
    blockId: string | number,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('near', network);

    if (!service) {
      return {
        success: false,
        error: `NEAR service not found for ${network}`,
      };
    }

    const params =
      typeof blockId === 'number'
        ? { block_id: blockId }
        : blockId === 'final' || blockId === 'optimistic'
        ? { finality: blockId }
        : { block_id: blockId };

    return this.blockchainService.callRPCMethod(service.id, 'block', params, appId);
  }

  /**
   * Get chunk details
   */
  async getChunk(
    chunkId: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('near', network);

    if (!service) {
      return {
        success: false,
        error: `NEAR service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(service.id, 'chunk', [chunkId], appId);
  }

  /**
   * Get gas price
   */
  async getGasPrice(
    blockId?: string | number,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('near', network);

    if (!service) {
      return {
        success: false,
        error: `NEAR service not found for ${network}`,
      };
    }

    const params = blockId
      ? typeof blockId === 'number'
        ? [blockId]
        : [blockId]
      : [null];

    return this.blockchainService.callRPCMethod(service.id, 'gas_price', params, appId);
  }

  /**
   * Get network info
   */
  async getNetworkInfo(
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('near', network);

    if (!service) {
      return {
        success: false,
        error: `NEAR service not found for ${network}`,
      };
    }

    return this.blockchainService.callRPCMethod(service.id, 'status', [], appId);
  }

  /**
   * Get validators
   */
  async getValidators(
    blockId?: string | number,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain('near', network);

    if (!service) {
      return {
        success: false,
        error: `NEAR service not found for ${network}`,
      };
    }

    const params = blockId
      ? typeof blockId === 'number'
        ? [blockId]
        : [blockId]
      : [null];

    return this.blockchainService.callRPCMethod(service.id, 'validators', params, appId);
  }
}
