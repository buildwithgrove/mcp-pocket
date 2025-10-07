#!/usr/bin/env node
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import built JS services from dist
import { BlockchainRPCService } from '../dist/services/blockchain-service.js';
import { AdvancedBlockchainService } from '../dist/services/advanced-blockchain-service.js';
import { SolanaService } from '../dist/services/solana-service.js';
import { CosmosService } from '../dist/services/cosmos-service.js';
import { SuiService } from '../dist/services/sui-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadConfig() {
  const cfgPath = join(__dirname, '..', 'dist', 'config', 'blockchain-services.json');
  const data = await readFile(cfgPath, 'utf-8');
  return JSON.parse(data);
}

async function run() {
  const config = await loadConfig();
  const rpc = new BlockchainRPCService(config);
  const adv = new AdvancedBlockchainService(rpc);
  const solana = new SolanaService(rpc);
  const cosmos = new CosmosService(rpc);
  const sui = new SuiService(rpc);

  const appId = process.env.GROVE_APP_ID;
  const results = {};

  // EVM: Ethereum gas price
  try {
    results.ethereum_gas = await adv.getGasPrice('ethereum', 'mainnet');
  } catch (e) {
    results.ethereum_gas = { success: false, error: e?.message || String(e) };
  }

  // Solana: block height
  try {
    results.solana_block_height = await solana.getBlockHeight('mainnet');
  } catch (e) {
    results.solana_block_height = { success: false, error: e?.message || String(e) };
  }

  // Cosmos: latest block (Osmosis)
  try {
    if (appId) {
      results.cosmos_osmosis_latest_block = await cosmos.getLatestBlock('osmosis', 'mainnet', appId);
    } else {
      results.cosmos_osmosis_latest_block = { success: true, skipped: true, reason: 'Set GROVE_APP_ID to test Cosmos REST' };
    }
  } catch (e) {
    results.cosmos_osmosis_latest_block = { success: false, error: e?.message || String(e) };
  }

  // Sui: reference gas price
  try {
    results.sui_reference_gas_price = await sui.getReferenceGasPrice('mainnet');
  } catch (e) {
    results.sui_reference_gas_price = { success: false, error: e?.message || String(e) };
  }

  // Summarize
  const summary = Object.fromEntries(
    Object.entries(results).map(([k, v]) => [k, { success: !!v?.success, skipped: !!v?.skipped, meta: v?.metadata }])
  );

  console.log('Smoke test results (summary):');
  console.log(JSON.stringify(summary, null, 2));
  console.log('\nDetailed results:');
  console.log(JSON.stringify(results, null, 2));

  // Exit non-zero if any failed
  const anyFailed = Object.values(results).some((r) => !r?.success && !r?.skipped);
  process.exit(anyFailed ? 1 : 0);
}

run().catch((e) => {
  console.error('Smoke test failed to run:', e);
  process.exit(2);
});
