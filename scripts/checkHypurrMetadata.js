import { ethers } from 'ethers';

// Hypurr NFT contract address
const HYPURR_ADDRESS = '0x9125E2d6827a00B0F8330D6ef7BEF07730Bac685';

// Hyperliquid RPC - CORRECTED URL
const RPC_URL = 'https://rpc.hyperliquid.xyz/evm';

const ERC721_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function totalSupply() external view returns (uint256)',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)'
];

async function checkMetadata() {
  console.log('🔍 Checking Hypurr NFT Metadata...\n');
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(HYPURR_ADDRESS, ERC721_ABI, provider);
  
  try {
    // Get basic info
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    
    console.log('📋 Collection Info:');
    console.log('   Name:', name);
    console.log('   Symbol:', symbol);
    console.log('   Total Supply:', totalSupply.toString());
    
    // Get metadata for first few tokens
    console.log('\n🎨 Sample Token URIs:');
    
    for (let i = 0; i < 5; i++) {
      try {
        const uri = await contract.tokenURI(i);
        console.log(`   Token ${i}:`, uri);
        
        // Extract base URI from first token
        if (i === 0 && uri) {
          const baseURI = uri.replace(/\d+$/, ''); // Remove token ID from end
          console.log('\n✅ Base URI:', baseURI);
        }
      } catch (e) {
        console.log(`   Token ${i}: Not found or error`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMetadata();