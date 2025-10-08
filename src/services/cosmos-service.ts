import { EndpointResponse } from '../types.js';
import { BlockchainRPCService } from './blockchain-service.js';

/**
 * Cosmos SDK blockchain service for accounts, staking, governance
 * Supports all 16 Cosmos chains: Osmosis, Juno, Kava, Akash, etc.
 */
export class CosmosService {
  private blockchainService: BlockchainRPCService;

  constructor(blockchainService: BlockchainRPCService) {
    this.blockchainService = blockchainService;
  }

  /**
   * Get base REST API URL for a Cosmos chain
   */
  private getRestUrl(blockchain: string, network: 'mainnet' | 'testnet' = 'mainnet'): string {
    const service = this.blockchainService.getServiceByBlockchain(blockchain, network);
    if (!service) {
      throw new Error(`Cosmos service not found: ${blockchain} (${network})`);
    }

    // Convert RPC URL to REST API URL
    // Pattern: https://<chain>.rpc.grove.city/v1/rest/<GROVE_APP_ID>
    const rpcUrl = service.rpcUrl.replace(/\/$/, '');
    const restUrl = rpcUrl.replace(/\/v1\/([^/]+)$/, '/v1/rest/$1');
    return restUrl;
  }

  /**
   * Make a REST API call to Cosmos endpoint
   */
  private async fetchRest(
    url: string
  ): Promise<EndpointResponse> {
    try {
      const effectiveAppId = process.env.GROVE_APP_ID;
      // If an override is provided, ensure it is used in the REST URL; otherwise keep URL as-is
      const finalUrl = effectiveAppId
        ? url.replace(/\/v1\/rest\/[^/]+/, `/v1/rest/${effectiveAppId}`)
        : url;

      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: {
            httpStatus: response.status,
            responseBody: errorText.substring(0, 500),
          },
        };
      }

      const data = await response.json();

      return {
        success: true,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: url,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get account balance for a Cosmos address
   */
  async getBalance(
    blockchain: string,
    address: string,
    denom?: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = denom
        ? `${baseUrl}/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=${denom}`
        : `${baseUrl}/cosmos/bank/v1beta1/balances/${address}`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos balance',
      };
    }
  }

  /**
   * Get all balances for an address
   */
  async getAllBalances(
    blockchain: string,
    address: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = `${baseUrl}/cosmos/bank/v1beta1/balances/${address}`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos balances',
      };
    }
  }

  /**
   * Get account information
   */
  async getAccount(
    blockchain: string,
    address: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = `${baseUrl}/cosmos/auth/v1beta1/accounts/${address}`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos account',
      };
    }
  }

  /**
   * Get delegations for an address (staked tokens)
   */
  async getDelegations(
    blockchain: string,
    delegatorAddress: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = `${baseUrl}/cosmos/staking/v1beta1/delegations/${delegatorAddress}`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos delegations',
      };
    }
  }

  /**
   * Get list of validators
   */
  async getValidators(
    blockchain: string,
    status: 'bonded' | 'unbonded' | 'unbonding' | 'all' = 'bonded',
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const statusFilter = status === 'all' ? '' : `?status=${status.toUpperCase()}`;
      const url = `${baseUrl}/cosmos/staking/v1beta1/validators${statusFilter}`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos validators',
      };
    }
  }

  /**
   * Get specific validator info
   */
  async getValidator(
    blockchain: string,
    validatorAddress: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = `${baseUrl}/cosmos/staking/v1beta1/validators/${validatorAddress}`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos validator',
      };
    }
  }

  /**
   * Get staking rewards for a delegator
   */
  async getRewards(
    blockchain: string,
    delegatorAddress: string,
    validatorAddress?: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = validatorAddress
        ? `${baseUrl}/cosmos/distribution/v1beta1/delegators/${delegatorAddress}/rewards/${validatorAddress}`
        : `${baseUrl}/cosmos/distribution/v1beta1/delegators/${delegatorAddress}/rewards`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos rewards',
      };
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(
    blockchain: string,
    txHash: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = `${baseUrl}/cosmos/tx/v1beta1/txs/${txHash}`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos transaction',
      };
    }
  }

  /**
   * Search transactions by events
   */
  async searchTransactions(
    blockchain: string,
    events: string[],
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const eventsQuery = events.map(e => `events=${encodeURIComponent(e)}`).join('&');
      const url = `${baseUrl}/cosmos/tx/v1beta1/txs?${eventsQuery}`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search Cosmos transactions',
      };
    }
  }

  /**
   * Get governance proposals
   */
  async getProposals(
    blockchain: string,
    status?: 'deposit_period' | 'voting_period' | 'passed' | 'rejected' | 'failed',
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const statusFilter = status ? `?proposal_status=${status}` : '';
      const url = `${baseUrl}/cosmos/gov/v1beta1/proposals${statusFilter}`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos proposals',
      };
    }
  }

  /**
   * Get specific proposal
   */
  async getProposal(
    blockchain: string,
    proposalId: number,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = `${baseUrl}/cosmos/gov/v1beta1/proposals/${proposalId}`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos proposal',
      };
    }
  }

  /**
   * Get votes for a proposal
   */
  async getProposalVotes(
    blockchain: string,
    proposalId: number,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = `${baseUrl}/cosmos/gov/v1beta1/proposals/${proposalId}/votes`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos proposal votes',
      };
    }
  }

  /**
   * Get latest block height
   */
  async getLatestBlock(
    blockchain: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = `${baseUrl}/cosmos/base/tendermint/v1beta1/blocks/latest`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos latest block',
      };
    }
  }

  /**
   * Get block at specific height
   */
  async getBlockByHeight(
    blockchain: string,
    height: number,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = `${baseUrl}/cosmos/base/tendermint/v1beta1/blocks/${height}`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos block',
      };
    }
  }

  /**
   * Get chain parameters
   */
  async getParams(
    blockchain: string,
    module: 'staking' | 'slashing' | 'distribution' | 'gov' | 'mint',
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<EndpointResponse> {
    try {
      const baseUrl = this.getRestUrl(blockchain, network);
      const url = `${baseUrl}/cosmos/${module}/v1beta1/params`;

      return this.fetchRest(url);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Cosmos params',
      };
    }
  }
}
