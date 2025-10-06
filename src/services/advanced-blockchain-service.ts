import { EndpointResponse } from '../types.js';
import { BlockchainRPCService } from './blockchain-service.js';

/**
 * Advanced blockchain service for transactions, tokens, blocks, and utilities
 */
export class AdvancedBlockchainService {
  private blockchainService: BlockchainRPCService;

  // Standard ERC-20 ABI methods
  private static readonly ERC20_BALANCE_OF = '0x70a08231'; // balanceOf(address)
  private static readonly ERC20_DECIMALS = '0x313ce567'; // decimals()
  private static readonly ERC20_SYMBOL = '0x95d89b41'; // symbol()
  private static readonly ERC20_NAME = '0x06fdde03'; // name()
  private static readonly ERC20_TOTAL_SUPPLY = '0x18160ddd'; // totalSupply()

  constructor(blockchainService: BlockchainRPCService) {
    this.blockchainService = blockchainService;
  }

  /**
   * Get transaction details by hash
   */
  async getTransaction(
    blockchain: string,
    txHash: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain(blockchain, network);

    if (!service) {
      return {
        success: false,
        error: `Blockchain service not found: ${blockchain} (${network})`,
      };
    }

    // Use appropriate method based on blockchain
    const method = service.category === 'evm' || service.category === 'layer2'
      ? 'eth_getTransactionByHash'
      : service.blockchain === 'solana'
      ? 'getTransaction'
      : 'eth_getTransactionByHash';

    return this.blockchainService.callRPCMethod(service.id, method, [txHash], appId);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(
    blockchain: string,
    txHash: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain(blockchain, network);

    if (!service) {
      return {
        success: false,
        error: `Blockchain service not found: ${blockchain} (${network})`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'eth_getTransactionReceipt',
      [txHash],
      appId
    );
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    blockchain: string,
    transaction: any,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain(blockchain, network);

    if (!service) {
      return {
        success: false,
        error: `Blockchain service not found: ${blockchain} (${network})`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'eth_estimateGas',
      [transaction],
      appId
    );
  }

  /**
   * Get ERC-20 token balance for an address
   */
  async getTokenBalance(
    blockchain: string,
    tokenAddress: string,
    walletAddress: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain(blockchain, network);

    if (!service) {
      return {
        success: false,
        error: `Blockchain service not found: ${blockchain} (${network})`,
      };
    }

    // Encode balanceOf(address) call
    const paddedAddress = walletAddress.replace('0x', '').padStart(64, '0');
    const data = AdvancedBlockchainService.ERC20_BALANCE_OF + paddedAddress;

    const result = await this.blockchainService.callRPCMethod(
      service.id,
      'eth_call',
      [
        {
          to: tokenAddress,
          data: data,
        },
        'latest',
      ],
      appId
    );

    if (result.success && result.data) {
      // Convert hex to decimal
      const balance = BigInt(result.data).toString();
      return {
        success: true,
        data: {
          balance,
          balanceHex: result.data,
        },
        metadata: result.metadata,
      };
    }

    return result;
  }

  /**
   * Get token metadata (name, symbol, decimals, totalSupply)
   */
  async getTokenMetadata(
    blockchain: string,
    tokenAddress: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain(blockchain, network);

    if (!service) {
      return {
        success: false,
        error: `Blockchain service not found: ${blockchain} (${network})`,
      };
    }

    try {
      // Call all methods in parallel
      const [decimalsResult, symbolResult, nameResult, totalSupplyResult] = await Promise.all([
        this.blockchainService.callRPCMethod(
          service.id,
          'eth_call',
          [{ to: tokenAddress, data: AdvancedBlockchainService.ERC20_DECIMALS }, 'latest'],
          appId
        ),
        this.blockchainService.callRPCMethod(
          service.id,
          'eth_call',
          [{ to: tokenAddress, data: AdvancedBlockchainService.ERC20_SYMBOL }, 'latest'],
          appId
        ),
        this.blockchainService.callRPCMethod(
          service.id,
          'eth_call',
          [{ to: tokenAddress, data: AdvancedBlockchainService.ERC20_NAME }, 'latest'],
          appId
        ),
        this.blockchainService.callRPCMethod(
          service.id,
          'eth_call',
          [{ to: tokenAddress, data: AdvancedBlockchainService.ERC20_TOTAL_SUPPLY }, 'latest'],
          appId
        ),
      ]);

      return {
        success: true,
        data: {
          address: tokenAddress,
          decimals: decimalsResult.success ? parseInt(decimalsResult.data, 16) : null,
          symbol: symbolResult.success ? this.decodeString(symbolResult.data) : null,
          name: nameResult.success ? this.decodeString(nameResult.data) : null,
          totalSupply: totalSupplyResult.success ? BigInt(totalSupplyResult.data).toString() : null,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: service.rpcUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch token metadata',
      };
    }
  }

  /**
   * Get block details with transactions
   */
  async getBlockDetails(
    blockchain: string,
    blockNumber: string | number,
    includeTransactions: boolean = false,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain(blockchain, network);

    if (!service) {
      return {
        success: false,
        error: `Blockchain service not found: ${blockchain} (${network})`,
      };
    }

    const blockParam = typeof blockNumber === 'number'
      ? '0x' + blockNumber.toString(16)
      : blockNumber;

    return this.blockchainService.callRPCMethod(
      service.id,
      'eth_getBlockByNumber',
      [blockParam, includeTransactions],
      appId
    );
  }

  /**
   * Search event logs
   */
  async searchLogs(
    blockchain: string,
    filter: {
      fromBlock?: string;
      toBlock?: string;
      address?: string | string[];
      topics?: (string | string[] | null)[];
    },
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain(blockchain, network);

    if (!service) {
      return {
        success: false,
        error: `Blockchain service not found: ${blockchain} (${network})`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'eth_getLogs',
      [filter],
      appId
    );
  }

  /**
   * Compare balance across multiple chains for the same address
   */
  async compareBalances(
    address: string,
    blockchains?: string[],
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    try {
      // Get all EVM chains if not specified
      const chainsToCheck = blockchains || this.getEVMChains();

      const results = await Promise.all(
        chainsToCheck.map(async (blockchain) => {
          const service = this.blockchainService.getServiceByBlockchain(blockchain, network);
          if (!service) {
            return { blockchain, error: 'Service not found', balance: null };
          }

          const result = await this.blockchainService.callRPCMethod(
            service.id,
            'eth_getBalance',
            [address, 'latest'],
            appId
          );

          if (result.success && result.data) {
            const weiBalance = BigInt(result.data);
            const ethBalance = Number(weiBalance) / 1e18;
            return {
              blockchain,
              balance: ethBalance,
              balanceWei: weiBalance.toString(),
              balanceHex: result.data,
            };
          }

          return { blockchain, error: result.error, balance: null };
        })
      );

      const totalBalance = results
        .filter(r => r.balance !== null)
        .reduce((sum, r) => sum + (r.balance || 0), 0);

      return {
        success: true,
        data: {
          address,
          balances: results,
          totalBalance,
          chainsWithBalance: results.filter(r => r.balance && r.balance > 0).length,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: 'multi-chain',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compare balances',
      };
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(
    blockchain: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain(blockchain, network);

    if (!service) {
      return {
        success: false,
        error: `Blockchain service not found: ${blockchain} (${network})`,
      };
    }

    const result = await this.blockchainService.callRPCMethod(
      service.id,
      'eth_gasPrice',
      [],
      appId
    );

    if (result.success && result.data) {
      const gasWei = BigInt(result.data);
      const gasGwei = Number(gasWei) / 1e9;
      return {
        success: true,
        data: {
          gasPrice: gasGwei,
          gasPriceWei: gasWei.toString(),
          gasPriceHex: result.data,
        },
        metadata: result.metadata,
      };
    }

    return result;
  }

  /**
   * Convert between units (wei/gwei/eth, etc.)
   */
  convertUnits(
    value: string,
    fromUnit: 'wei' | 'gwei' | 'eth',
    toUnit: 'wei' | 'gwei' | 'eth'
  ): EndpointResponse {
    try {
      const unitMap = {
        wei: 1n,
        gwei: 1000000000n,
        eth: 1000000000000000000n,
      };

      const valueWei = BigInt(value) * unitMap[fromUnit];
      const result = valueWei / unitMap[toUnit];

      return {
        success: true,
        data: {
          value: result.toString(),
          fromUnit,
          toUnit,
          exact: valueWei % unitMap[toUnit] === 0n,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert units',
      };
    }
  }

  /**
   * Validate address format
   */
  validateAddress(address: string, blockchain: string): EndpointResponse {
    try {
      const service = this.blockchainService.getServiceByBlockchain(blockchain);

      if (!service) {
        return {
          success: false,
          error: `Blockchain service not found: ${blockchain}`,
        };
      }

      let isValid = false;
      let format = '';

      if (service.category === 'evm' || service.category === 'layer2') {
        // EVM address validation
        isValid = /^0x[a-fA-F0-9]{40}$/.test(address);
        format = 'EVM (0x + 40 hex characters)';
      } else if (service.blockchain === 'solana') {
        // Solana address validation (base58, 32-44 chars typically)
        isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
        format = 'Solana (base58, 32-44 characters)';
      } else if (service.category === 'cosmos') {
        // Cosmos address validation (bech32)
        isValid = /^[a-z]+1[a-z0-9]{38,}$/.test(address);
        format = 'Cosmos (bech32 format)';
      }

      return {
        success: true,
        data: {
          address,
          blockchain,
          isValid,
          format,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate address',
      };
    }
  }

  /**
   * Decode hex string to UTF-8
   */
  decodeHex(hex: string): EndpointResponse {
    try {
      const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
      const bytes = Buffer.from(cleanHex, 'hex');
      const utf8 = bytes.toString('utf8');
      const ascii = bytes.toString('ascii');

      return {
        success: true,
        data: {
          hex,
          utf8,
          ascii,
          bytes: Array.from(bytes),
          length: bytes.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to decode hex',
      };
    }
  }

  /**
   * Call a contract view function
   */
  async callContractView(
    blockchain: string,
    contractAddress: string,
    data: string,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain(blockchain, network);

    if (!service) {
      return {
        success: false,
        error: `Blockchain service not found: ${blockchain} (${network})`,
      };
    }

    return this.blockchainService.callRPCMethod(
      service.id,
      'eth_call',
      [
        {
          to: contractAddress,
          data: data,
        },
        'latest',
      ],
      appId
    );
  }

  /**
   * Get historical balance at a specific block
   */
  async getHistoricalBalance(
    blockchain: string,
    address: string,
    blockNumber: string | number,
    network: 'mainnet' | 'testnet' = 'mainnet',
    appId?: string
  ): Promise<EndpointResponse> {
    const service = this.blockchainService.getServiceByBlockchain(blockchain, network);

    if (!service) {
      return {
        success: false,
        error: `Blockchain service not found: ${blockchain} (${network})`,
      };
    }

    const blockParam = typeof blockNumber === 'number'
      ? '0x' + blockNumber.toString(16)
      : blockNumber;

    const result = await this.blockchainService.callRPCMethod(
      service.id,
      'eth_getBalance',
      [address, blockParam],
      appId
    );

    if (result.success && result.data) {
      const weiBalance = BigInt(result.data);
      const ethBalance = Number(weiBalance) / 1e18;
      return {
        success: true,
        data: {
          address,
          blockNumber: blockParam,
          balance: ethBalance,
          balanceWei: weiBalance.toString(),
          balanceHex: result.data,
        },
        metadata: result.metadata,
      };
    }

    return result;
  }

  /**
   * Get EVM-compatible chains
   */
  private getEVMChains(): string[] {
    const evmChains = this.blockchainService.getAllServices()
      .filter(s => (s.category === 'evm' || s.category === 'layer2') && s.network === 'mainnet')
      .map(s => s.blockchain);

    return [...new Set(evmChains)];
  }

  /**
   * Decode string from contract return data
   */
  private decodeString(hex: string): string {
    try {
      if (!hex || hex === '0x') return '';

      const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

      // Skip the first 64 bytes (offset) and next 64 bytes (length)
      const lengthHex = cleanHex.slice(64, 128);
      const length = parseInt(lengthHex, 16);

      if (length === 0) return '';

      const dataHex = cleanHex.slice(128, 128 + length * 2);
      return Buffer.from(dataHex, 'hex').toString('utf8');
    } catch {
      return '';
    }
  }
}
