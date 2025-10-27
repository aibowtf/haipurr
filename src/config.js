// config.js - Central configuration for Hypurr Marketplace
require('dotenv').config();

const NETWORKS = {
  testnet: {
    name: 'Hyperliquid Testnet',
    rpc: 'https://rpc.hyperliquid-testnet.xyz/evm',
    chainId: 998,
    explorer: 'https://explorer.hyperliquid-testnet.xyz',
    currency: 'HYPE'
  },
  mainnet: {
    name: 'Hyperliquid',
    rpc: 'https://rpc.hyperliquid.xyz/evm',
    chainId: 999,
    explorer: 'https://hyperevmscan.io',
    currency: 'HYPE'
  }
};

// ⚠️ SWITCH THIS TO 'mainnet' WHEN READY TO GO LIVE
const CURRENT_NETWORK = 'testnet';

const CONTRACTS = {
  testnet: {
    hypurrNFT: process.env.NEXT_PUBLIC_TEST_NFT_CONTRACT || '',
    marketplace: process.env.NEXT_PUBLIC_TEST_MARKETPLACE_CONTRACT || '',
    wHYPE: '0x5555555555555555555555555555555555555555'
  },
  mainnet: {
    hypurrNFT: '0x9125E2d6827a00B0F8330D6ef7BEF07730Bac685',
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || '',
    wHYPE: '0x5555555555555555555555555555555555555555'
  }
};

const METADATA = {
  baseUri: 'ipfs://bafybeigs5lojzzear4gyuizxgmdabdam7jftguarspv4rcxw665pkioxdy/',
  ipfsGateways: [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://nftstorage.link/ipfs/'
  ]
};

const ipfsToHttp = (ipfsUri, gatewayIndex = 0) => {
  if (!ipfsUri) return '';
  return ipfsUri.replace('ipfs://', METADATA.ipfsGateways[gatewayIndex]);
};

const config = {
  network: NETWORKS[CURRENT_NETWORK],
  contracts: CONTRACTS[CURRENT_NETWORK],
  isTestnet: CURRENT_NETWORK === 'testnet',
  metadata: METADATA,
  ipfsToHttp,
  networks: NETWORKS,
  allContracts: CONTRACTS
};

module.exports = config;
export default config;
export { NETWORKS, CONTRACTS, METADATA, ipfsToHttp };