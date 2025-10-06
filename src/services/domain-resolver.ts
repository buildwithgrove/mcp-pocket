import { EndpointResponse } from '../types.js';
import { BlockchainRPCService } from './blockchain-service.js';
import { keccak256 as keccakHash } from 'js-sha3';

/**
 * Service for resolving blockchain domain names (ENS, Unstoppable Domains)
 */
export class DomainResolverService {
  private blockchainService: BlockchainRPCService;

  // ENS Registry contract address on Ethereum mainnet
  private static readonly ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

  // ENS Public Resolver contract address
  private static readonly ENS_PUBLIC_RESOLVER = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63';

  // Unstoppable Domains ProxyReader contract on Polygon
  private static readonly UD_PROXY_READER = '0xA3f32c8cd786dc089Bd1fC175F2707223aeE5d00';

  constructor(blockchainService: BlockchainRPCService) {
    this.blockchainService = blockchainService;
  }

  /**
   * Resolve a domain name to an address
   * Supports ENS (.eth) and Unstoppable Domains (.crypto, .nft, .blockchain, .bitcoin, .coin, .wallet, .888, .dao, .x, .zil)
   */
  async resolveDomain(domain: string, appId?: string): Promise<EndpointResponse> {
    const domainLower = domain.toLowerCase().trim();

    // Determine domain type
    if (domainLower.endsWith('.eth')) {
      return this.resolveENS(domainLower, appId);
    } else if (this.isUnstoppableDomain(domainLower)) {
      return this.resolveUnstoppableDomain(domainLower, appId);
    } else {
      return {
        success: false,
        error: `Unsupported domain type: ${domain}. Supported: .eth (ENS), .crypto, .nft, .blockchain, .bitcoin, .coin, .wallet, .888, .dao, .x, .zil (Unstoppable Domains)`,
      };
    }
  }

  /**
   * Check if domain is an Unstoppable Domain
   */
  private isUnstoppableDomain(domain: string): boolean {
    const udTLDs = [
      '.crypto', '.nft', '.blockchain', '.bitcoin', '.coin',
      '.wallet', '.888', '.dao', '.x', '.zil'
    ];
    return udTLDs.some(tld => domain.endsWith(tld));
  }

  /**
   * Resolve ENS domain using Grove's Ethereum endpoint
   */
  private async resolveENS(domain: string, appId?: string): Promise<EndpointResponse> {
    try {
      // Step 1: Get the namehash of the domain
      const namehash = this.namehash(domain);

      // Step 2: Get the resolver address from ENS registry
      const resolverData = this.encodeResolverCall(namehash);
      const resolverResult = await this.blockchainService.callRPCMethod(
        'ethereum-mainnet',
        'eth_call',
        [
          {
            to: DomainResolverService.ENS_REGISTRY,
            data: resolverData,
          },
          'latest',
        ],
        appId
      );

      if (!resolverResult.success || !resolverResult.data) {
        return {
          success: false,
          error: `Failed to get resolver for ${domain}: ${resolverResult.error}`,
        };
      }

      // Extract resolver address from response (remove leading zeros)
      const resolverAddress = '0x' + resolverResult.data.slice(-40);

      // Check if resolver is set (not zero address)
      if (resolverAddress === '0x0000000000000000000000000000000000000000') {
        return {
          success: false,
          error: `No resolver set for ${domain}`,
        };
      }

      // Step 3: Get the address from the resolver
      const addressData = this.encodeAddrCall(namehash);
      const addressResult = await this.blockchainService.callRPCMethod(
        'ethereum-mainnet',
        'eth_call',
        [
          {
            to: resolverAddress,
            data: addressData,
          },
          'latest',
        ],
        appId
      );

      if (!addressResult.success || !addressResult.data) {
        return {
          success: false,
          error: `Failed to resolve address for ${domain}: ${addressResult.error}`,
        };
      }

      // Extract address from response
      const address = '0x' + addressResult.data.slice(-40);

      // Check if address is set
      if (address === '0x0000000000000000000000000000000000000000') {
        return {
          success: false,
          error: `No address set for ${domain}`,
        };
      }

      return {
        success: true,
        data: {
          domain,
          address,
          type: 'ENS',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: 'ethereum-mainnet',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error resolving ENS domain',
      };
    }
  }

  /**
   * Resolve Unstoppable Domain using Grove's Polygon endpoint
   */
  private async resolveUnstoppableDomain(domain: string, appId?: string): Promise<EndpointResponse> {
    try {
      // Get the tokenId (namehash) of the domain
      const tokenId = this.namehash(domain);

      // Encode the call to getMany(keys, tokenId)
      // We want to get the crypto.ETH.address record
      const keys = ['crypto.ETH.address'];
      const callData = this.encodeGetManyCall(keys, tokenId);

      const result = await this.blockchainService.callRPCMethod(
        'polygon-mainnet',
        'eth_call',
        [
          {
            to: DomainResolverService.UD_PROXY_READER,
            data: callData,
          },
          'latest',
        ],
        appId
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          error: `Failed to resolve Unstoppable Domain ${domain}: ${result.error}`,
        };
      }

      // Decode the response - it returns an array of strings
      const address = this.decodeGetManyResponse(result.data);

      if (!address || address === '0x0000000000000000000000000000000000000000') {
        return {
          success: false,
          error: `No address set for ${domain}`,
        };
      }

      return {
        success: true,
        data: {
          domain,
          address,
          type: 'Unstoppable Domains',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: 'polygon-mainnet',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error resolving Unstoppable Domain',
      };
    }
  }

  /**
   * Calculate namehash for a domain (EIP-137)
   */
  private namehash(domain: string): string {
    let node = '0x0000000000000000000000000000000000000000000000000000000000000000';

    if (domain) {
      const labels = domain.split('.');
      for (let i = labels.length - 1; i >= 0; i--) {
        const labelHash = this.keccak256(labels[i]);
        node = this.keccak256(Buffer.concat([
          Buffer.from(node.slice(2), 'hex'),
          Buffer.from(labelHash.slice(2), 'hex')
        ]));
      }
    }

    return node;
  }

  /**
   * Keccak256 hash function (used for ENS namehash)
   */
  private keccak256(data: string | Buffer): string {
    if (typeof data === 'string') {
      return '0x' + keccakHash(data);
    } else {
      return '0x' + keccakHash(data);
    }
  }

  /**
   * Encode the resolver(bytes32) call
   */
  private encodeResolverCall(namehash: string): string {
    // Function signature: resolver(bytes32) = 0x0178b8bf
    const functionSig = '0x0178b8bf';
    const paddedNamehash = namehash.slice(2).padStart(64, '0');
    return functionSig + paddedNamehash;
  }

  /**
   * Encode the addr(bytes32) call
   */
  private encodeAddrCall(namehash: string): string {
    // Function signature: addr(bytes32) = 0x3b3b57de
    const functionSig = '0x3b3b57de';
    const paddedNamehash = namehash.slice(2).padStart(64, '0');
    return functionSig + paddedNamehash;
  }

  /**
   * Encode the getMany(string[] keys, uint256 tokenId) call for Unstoppable Domains
   */
  private encodeGetManyCall(keys: string[], tokenId: string): string {
    // Function signature: getMany(string[],uint256) = 0x1bd8cc1a
    const functionSig = '0x1bd8cc1a';

    // Encode the array offset (0x40 = 64 bytes, after the two parameters pointers)
    const arrayOffset = '0000000000000000000000000000000000000000000000000000000000000040';

    // Encode tokenId
    const paddedTokenId = tokenId.slice(2).padStart(64, '0');

    // Encode array length
    const arrayLength = keys.length.toString(16).padStart(64, '0');

    // Encode each key
    let encodedKeys = '';
    let dataOffset = keys.length * 32; // Each key pointer takes 32 bytes

    for (const key of keys) {
      encodedKeys += dataOffset.toString(16).padStart(64, '0');
      dataOffset += 32 + Math.ceil(key.length / 32) * 32; // string length + padded data
    }

    for (const key of keys) {
      const keyLength = key.length.toString(16).padStart(64, '0');
      const keyHex = Buffer.from(key, 'utf8').toString('hex').padEnd(Math.ceil(key.length / 32) * 64, '0');
      encodedKeys += keyLength + keyHex;
    }

    return functionSig + arrayOffset + paddedTokenId + arrayLength + encodedKeys;
  }

  /**
   * Decode the getMany response
   */
  private decodeGetManyResponse(data: string): string {
    try {
      // Response is an array of strings, we want the first one
      // Skip the first 64 bytes (array offset)
      // Next 64 bytes are array length
      // Then we have the offset to the first string
      // Skip to the string data (offset + length)

      const hex = data.slice(2); // Remove 0x

      // Get offset to array data (first 64 chars)
      const arrayOffset = parseInt(hex.slice(0, 64), 16) * 2;

      // Get array length
      const arrayLength = parseInt(hex.slice(arrayOffset, arrayOffset + 64), 16);

      if (arrayLength === 0) {
        return '';
      }

      // Get offset to first string
      const firstStringOffset = parseInt(hex.slice(arrayOffset + 64, arrayOffset + 128), 16) * 2 + arrayOffset;

      // Get string length
      const stringLength = parseInt(hex.slice(firstStringOffset, firstStringOffset + 64), 16);

      if (stringLength === 0) {
        return '';
      }

      // Get string data
      const stringData = hex.slice(firstStringOffset + 64, firstStringOffset + 64 + stringLength * 2);
      const address = Buffer.from(stringData, 'hex').toString('utf8');

      return address;
    } catch (error) {
      return '';
    }
  }
}
