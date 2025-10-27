import { ethers } from 'ethers';
import fs from 'fs';

const HYPURR_ADDRESS = '0x9125E2d6827a00B0F8330D6ef7BEF07730Bac685';
const RPC_URL = 'https://rpc.hyperliquid.xyz/evm';

const ERC721_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function totalSupply() external view returns (uint256)'
];

function ipfsToHttp(ipfsUri) {
  return ipfsUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
}

async function fetchMetadata(tokenUri) {
  const httpUrl = ipfsToHttp(tokenUri);
  
  try {
    const response = await fetch(httpUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
    return null;
  }
}

async function gatherTestMetadata() {
  console.log('🔍 Gathering 100 Random Hypurr Metadata Files...\n');
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(HYPURR_ADDRESS, ERC721_ABI, provider);
  
  try {
    // Get total supply
    const totalSupply = await contract.totalSupply();
    const total = Number(totalSupply);
    console.log(`📊 Total Hypurr Supply: ${total}\n`);
    
    // Generate 100 random token IDs
    const randomIds = new Set();
    while (randomIds.size < 100) {
      const randomId = Math.floor(Math.random() * total);
      randomIds.add(randomId);
    }
    
    const selectedIds = Array.from(randomIds).sort((a, b) => a - b);
    console.log(`🎲 Selected Random IDs: ${selectedIds.slice(0, 10).join(', ')}...\n`);
    
    const metadataCollection = [];
    
    // Fetch metadata for each token
    for (let i = 0; i < selectedIds.length; i++) {
      const tokenId = selectedIds[i];
      console.log(`[${i + 1}/100] Fetching Token #${tokenId}...`);
      
      try {
        const uri = await contract.tokenURI(tokenId);
        const metadata = await fetchMetadata(uri);
        
        if (metadata) {
          // Store with new sequential ID
          metadataCollection.push({
            originalId: tokenId,
            newId: i,
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            attributes: metadata.attributes
          });
          
          console.log(`   ✅ ${metadata.name}`);
        } else {
          console.log(`   ❌ Failed to fetch metadata`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Save to file
    const output = {
      count: metadataCollection.length,
      baseUri: 'ipfs://bafybeigs5lojzzear4gyuizxgmdabdam7jftguarspv4rcxw665pkioxdy/',
      collection: metadataCollection
    };
    
    fs.writeFileSync('test-hypurr-metadata.json', JSON.stringify(output, null, 2));
    
    console.log(`\n✅ Successfully gathered ${metadataCollection.length} metadata files!`);
    console.log(`📁 Saved to: test-hypurr-metadata.json`);
    
    // Extract base URIs
    if (metadataCollection.length > 0) {
      const firstUri = await contract.tokenURI(selectedIds[0]);
      const metadataBaseUri = firstUri.replace(/\d+$/, '');
      
      console.log(`\n📋 Base URIs Found:`);
      console.log(`   Metadata: ${metadataBaseUri}`);
      if (metadataCollection[0].image) {
        console.log(`   Images: ${metadataCollection[0].image.replace(/\/[^/]*$/, '/')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
  }
}

gatherTestMetadata();