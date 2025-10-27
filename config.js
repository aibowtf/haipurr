import dotenv from 'dotenv';
dotenv.config();

const NETWORKS = {
  testnet: {
    name: 'Hyperliquid Testnet',
    rpc: 'https://rpcs.chain.link/hyperevm/testnet',
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

const CURRENT_NETWORK = 'testnet';

const CONTRACTS = {
  testnet: {
    hypurrNFT: process.env.NEXT_PUBLIC_TEST_NFT_CONTRACT || '0x94477dE92362b9cA757B77206410265901a2Be11',
    marketplace: process.env.NEXT_PUBLIC_TEST_MARKETPLACE_CONTRACT || '0x2f76CAEaAd9392Dfa7EAD41fa67BA052BEe3a072',
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

console.log('🔧 Config loaded - RPC:', config.network.rpc);
export default config;
export { NETWORKS, CONTRACTS, METADATA, ipfsToHttp };
console.log('🔧 Config loaded - RPC:', config.network.rpc);
