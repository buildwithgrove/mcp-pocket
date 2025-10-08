import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CosmosService } from '../cosmos-service.js';
import { BlockchainRPCService } from '../blockchain-service.js';
import type { BlockchainService, RPCMethod } from '../../types.js';

describe('CosmosService', () => {
  let cosmosService: CosmosService;
  let mockBlockchainService: BlockchainRPCService;

  beforeEach(() => {
    const mockServicesData = {
      methodAliases: {},
      services: [
        {
          id: 'osmosis-mainnet',
          name: 'Osmosis Mainnet',
          blockchain: 'osmosis',
          network: 'mainnet',
          rpcUrl: 'https://osmosis.rpc.grove.city/v1/test-app-id',
          protocol: 'rest',
          category: 'cosmos',
          supportedMethods: [] as RPCMethod[],
        },
        {
          id: 'persistence-mainnet',
          name: 'Persistence Mainnet',
          blockchain: 'persistence',
          network: 'mainnet',
          rpcUrl: 'https://persistence.rpc.grove.city/v1/test-app-id',
          protocol: 'rest',
          category: 'cosmos',
          supportedMethods: [] as RPCMethod[],
        },
      ] as BlockchainService[],
    };

    mockBlockchainService = new BlockchainRPCService(mockServicesData);
    cosmosService = new CosmosService(mockBlockchainService);

    vi.restoreAllMocks();
  });

  describe('getBalance', () => {
    it('should get balance for specific denom', async () => {
      const mockBalance = {
        balance: {
          denom: 'uosmo',
          amount: '1000000',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBalance,
      });

      const result = await cosmosService.getBalance(
        'osmosis',
        'osmo1address',
        'uosmo',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBalance);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cosmos/bank/v1beta1/balances/osmo1address/by_denom?denom=uosmo'),
        expect.any(Object)
      );
    });

    it('should get all balances when denom not specified', async () => {
      const mockBalances = {
        balances: [
          { denom: 'uosmo', amount: '1000000' },
          { denom: 'uion', amount: '500000' },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBalances,
      });

      const result = await cosmosService.getBalance(
        'osmosis',
        'osmo1address',
        undefined,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBalances);
    });

    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Account not found',
      });

      const result = await cosmosService.getBalance(
        'osmosis',
        'osmo1address',
        'uosmo'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 404');
    });
  });

  describe('getAllBalances', () => {
    it('should get all balances for an address', async () => {
      const mockBalances = {
        balances: [
          { denom: 'uosmo', amount: '1000000' },
        ],
        pagination: {
          next_key: null,
          total: '1',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBalances,
      });

      const result = await cosmosService.getAllBalances(
        'osmosis',
        'osmo1address',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.balances).toHaveLength(1);
    });
  });

  describe('getDelegations', () => {
    it('should get delegations for an address', async () => {
      const mockDelegations = {
        delegation_responses: [
          {
            delegation: {
              delegator_address: 'osmo1address',
              validator_address: 'osmovaloper1validator',
              shares: '1000000.000000000000000000',
            },
            balance: {
              denom: 'uosmo',
              amount: '1000000',
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDelegations,
      });

      const result = await cosmosService.getDelegations(
        'osmosis',
        'osmo1address',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.delegation_responses).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cosmos/staking/v1beta1/delegations/osmo1address'),
        expect.any(Object)
      );
    });
  });

  describe('getValidators', () => {
    it('should get bonded validators', async () => {
      const mockValidators = {
        validators: [
          {
            operator_address: 'osmovaloper1validator',
            status: 'BOND_STATUS_BONDED',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockValidators,
      });

      const result = await cosmosService.getValidators(
        'osmosis',
        'bonded',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?status=BONDED'),
        expect.any(Object)
      );
    });

    it('should get all validators when status is "all"', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ validators: [] }),
      });

      await cosmosService.getValidators('osmosis', 'all', 'mainnet');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining('?status='),
        expect.any(Object)
      );
    });
  });

  describe('getValidator', () => {
    it('should get specific validator info', async () => {
      const mockValidator = {
        validator: {
          operator_address: 'osmovaloper1validator',
          tokens: '10000000',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockValidator,
      });

      const result = await cosmosService.getValidator(
        'osmosis',
        'osmovaloper1validator',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.validator.operator_address).toBe('osmovaloper1validator');
    });
  });

  describe('getRewards', () => {
    it('should get all rewards for a delegator', async () => {
      const mockRewards = {
        rewards: [
          {
            validator_address: 'osmovaloper1validator',
            reward: [{ denom: 'uosmo', amount: '1000.123' }],
          },
        ],
        total: [{ denom: 'uosmo', amount: '1000.123' }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRewards,
      });

      const result = await cosmosService.getRewards(
        'osmosis',
        'osmo1address',
        undefined,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.rewards).toBeDefined();
    });

    it('should get rewards for specific validator', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ rewards: [] }),
      });

      await cosmosService.getRewards(
        'osmosis',
        'osmo1address',
        'osmovaloper1validator',
        'mainnet'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rewards/osmovaloper1validator'),
        expect.any(Object)
      );
    });
  });

  describe('getTransaction', () => {
    it('should get transaction by hash', async () => {
      const mockTx = {
        tx_response: {
          txhash: 'ABC123',
          height: '123456',
          code: 0,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTx,
      });

      const result = await cosmosService.getTransaction(
        'osmosis',
        'ABC123',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.tx_response.txhash).toBe('ABC123');
    });
  });

  describe('searchTransactions', () => {
    it('should search transactions by events', async () => {
      const mockTxs = {
        txs: [],
        tx_responses: [],
        pagination: {
          total: '0',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTxs,
      });

      const result = await cosmosService.searchTransactions(
        'osmosis',
        ['message.action=/cosmos.bank.v1beta1.MsgSend'],
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('events='),
        expect.any(Object)
      );
    });
  });

  describe('getProposals', () => {
    it('should get all proposals', async () => {
      const mockProposals = {
        proposals: [
          {
            proposal_id: '1',
            status: 'PROPOSAL_STATUS_VOTING_PERIOD',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProposals,
      });

      const result = await cosmosService.getProposals(
        'osmosis',
        undefined,
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.proposals).toHaveLength(1);
    });

    it('should filter proposals by status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ proposals: [] }),
      });

      await cosmosService.getProposals('osmosis', 'voting_period', 'mainnet');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?proposal_status=voting_period'),
        expect.any(Object)
      );
    });
  });

  describe('getProposal', () => {
    it('should get specific proposal', async () => {
      const mockProposal = {
        proposal: {
          proposal_id: '1',
          status: 'PROPOSAL_STATUS_PASSED',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProposal,
      });

      const result = await cosmosService.getProposal('osmosis', 1, 'mainnet');

      expect(result.success).toBe(true);
      expect(result.data?.proposal.proposal_id).toBe('1');
    });
  });

  describe('getProposalVotes', () => {
    it('should get votes for a proposal', async () => {
      const mockVotes = {
        votes: [
          {
            proposal_id: '1',
            voter: 'osmo1voter',
            option: 'VOTE_OPTION_YES',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockVotes,
      });

      const result = await cosmosService.getProposalVotes('osmosis', 1, 'mainnet');

      expect(result.success).toBe(true);
      expect(result.data?.votes).toBeDefined();
    });
  });

  describe('getLatestBlock', () => {
    it('should get latest block', async () => {
      const mockBlock = {
        block_id: { hash: 'ABC123' },
        block: {
          header: {
            height: '123456',
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBlock,
      });

      const result = await cosmosService.getLatestBlock('osmosis', 'mainnet');

      expect(result.success).toBe(true);
      expect(result.data?.block.header.height).toBe('123456');
    });
  });

  describe('getBlockByHeight', () => {
    it('should get block at specific height', async () => {
      const mockBlock = {
        block_id: { hash: 'ABC123' },
        block: {
          header: {
            height: '100',
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBlock,
      });

      const result = await cosmosService.getBlockByHeight('osmosis', 100, 'mainnet');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/blocks/100'),
        expect.any(Object)
      );
    });
  });

  describe('getParams', () => {
    it('should get staking params', async () => {
      const mockParams = {
        params: {
          unbonding_time: '1814400s',
          max_validators: 100,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockParams,
      });

      const result = await cosmosService.getParams('osmosis', 'staking', 'mainnet');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cosmos/staking/v1beta1/params'),
        expect.any(Object)
      );
    });
  });

  describe('getAccount', () => {
    it('should get account information', async () => {
      const mockAccount = {
        account: {
          '@type': '/cosmos.auth.v1beta1.BaseAccount',
          address: 'osmo1address',
          sequence: '10',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAccount,
      });

      const result = await cosmosService.getAccount(
        'osmosis',
        'osmo1address',
        'mainnet'
      );

      expect(result.success).toBe(true);
      expect(result.data?.account.address).toBe('osmo1address');
    });
  });

  describe('REST URL Construction', () => {
    it('should properly construct REST URLs', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await cosmosService.getBalance('osmosis', 'osmo1address', 'uosmo', 'mainnet');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/rest/'),
        expect.any(Object)
      );
    });

    // appId parameter support removed; GROVE_APP_ID env var is the single source now
  });
});
