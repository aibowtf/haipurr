import { config as dotenvConfig } from "dotenv";
import hre from "hardhat";

dotenvConfig();

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_TEST_MARKETPLACE_CONTRACT;

const MARKETPLACE_ABI = [
  "function buyNFTFromMarketplace(uint256 tokenId) external",
  "function buyTokens(address tokenAddress, uint256 amount) external",
  "function getContractBalance() external view returns (uint256)",
  "function getContractWHYPEBalance() external view returns (uint256)",
  "function treasuryBalances(address) external view returns (uint256)",
  "function treasury_0() external view returns (address)",
  "function treasury_1() external view returns (address)",
  "function treasury_2() external view returns (address)",
  "function listings(uint256) external view returns (address seller, uint256 price, bool active)"
];

async function checkBalances() {
  console.log("💰 Checking Treasury Balances...\n");
  
  const [signer] = await hre.ethers.getSigners();
  const marketplace = new hre.ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
  
  const treasury0 = await marketplace.treasury_0();
  const treasury1 = await marketplace.treasury_1();
  const treasury2 = await marketplace.treasury_2();
  
  const contractBalance = await marketplace.getContractBalance();
  const contractWHYPE = await marketplace.getContractWHYPEBalance();
  
  console.log("📊 Contract Balances:");
  console.log("   Native HYPE:", hre.ethers.formatEther(contractBalance));
  console.log("   wHYPE:", hre.ethers.formatEther(contractWHYPE));
  
  console.log("\n📊 Treasury Accumulated (Tracked):");
  console.log("   Treasury 0 (80%):", hre.ethers.formatEther(await marketplace.treasuryBalances(treasury0)));
  console.log("   Treasury 1 (10%):", hre.ethers.formatEther(await marketplace.treasuryBalances(treasury1)));
  console.log("   Treasury 2 (10%):", hre.ethers.formatEther(await marketplace.treasuryBalances(treasury2)));
  
  console.log("\n📍 Treasury Addresses:");
  console.log("   Treasury 0:", treasury0);
  console.log("   Treasury 1:", treasury1);
  console.log("   Treasury 2:", treasury2);
}

async function buyNFT(tokenId) {
  console.log(`🛒 Buying NFT #${tokenId} from marketplace...\n`);
  
  const [signer] = await hre.ethers.getSigners();
  const marketplace = new hre.ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
  
  // Check if NFT is listed
  const listing = await marketplace.listings(tokenId);
  if (!listing.active) {
    console.log("❌ NFT is not listed for sale");
    return;
  }
  
  console.log("📋 Listing Details:");
  console.log("   Seller:", listing.seller);
  console.log("   Price:", hre.ethers.formatEther(listing.price), "HYPE");
  
  // Check contract balance
  const contractBalance = await marketplace.getContractBalance();
  console.log("\n💰 Contract Balance:", hre.ethers.formatEther(contractBalance), "HYPE");
  
  if (contractBalance < listing.price) {
    console.log("❌ Insufficient contract balance to buy this NFT");
    console.log(`   Need: ${hre.ethers.formatEther(listing.price)} HYPE`);
    console.log(`   Have: ${hre.ethers.formatEther(contractBalance)} HYPE`);
    return;
  }
  
  console.log("\n✅ Proceeding with purchase...");
  
  try {
    const tx = await marketplace.buyNFTFromMarketplace(tokenId);
    console.log("📤 Transaction sent:", tx.hash);
    await tx.wait();
    
    console.log("✅ NFT purchased successfully!");
    console.log("   NFT now owned by Treasury 0");
    
    await checkBalances();
  } catch (error) {
    console.error("❌ Error buying NFT:", error.message);
  }
}

async function buyTokens(tokenAddress, amount) {
  console.log(`🪙 Purchasing tokens...\n`);
  
  const [signer] = await hre.ethers.getSigners();
  const marketplace = new hre.ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
  
  const amountWei = hre.ethers.parseEther(amount);
  
  console.log("📋 Purchase Details:");
  console.log("   Token Address:", tokenAddress);
  console.log("   Amount to Spend:", amount, "HYPE");
  
  // Check contract balance
  const contractBalance = await marketplace.getContractBalance();
  console.log("\n💰 Contract Balance:", hre.ethers.formatEther(contractBalance), "HYPE");
  
  if (contractBalance < amountWei) {
    console.log("❌ Insufficient contract balance");
    return;
  }
  
  console.log("\n✅ Proceeding with token purchase...");
  console.log("⚠️  Note: This sends HYPE to Treasury 1 for manual purchase");
  console.log("   (DEX integration can be added later)");
  
  try {
    const tx = await marketplace.buyTokens(tokenAddress, amountWei);
    console.log("📤 Transaction sent:", tx.hash);
    await tx.wait();
    
    console.log("✅ Tokens purchased (HYPE sent to Treasury 1)!");
    
    await checkBalances();
  } catch (error) {
    console.error("❌ Error buying tokens:", error.message);
  }
}

// Main script
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!MARKETPLACE_ADDRESS) {
    console.error("❌ Error: NEXT_PUBLIC_TEST_MARKETPLACE_CONTRACT not found in .env");
    return;
  }
  
  console.log("🔧 Hypurr Marketplace Admin Functions");
  console.log("📍 Marketplace:", MARKETPLACE_ADDRESS);
  console.log("=".repeat(60) + "\n");
  
  switch (command) {
    case "balances":
      await checkBalances();
      break;
      
    case "buyNFT":
      const tokenId = args[1];
      if (!tokenId) {
        console.log("Usage: npm run admin buyNFT <tokenId>");
        console.log("Example: npm run admin buyNFT 5");
        return;
      }
      await buyNFT(tokenId);
      break;
      
    case "buyTokens":
      const tokenAddr = args[1];
      const amount = args[2];
      if (!tokenAddr || !amount) {
        console.log("Usage: npm run admin buyTokens <tokenAddress> <amount>");
        console.log("Example: npm run admin buyTokens 0x123...abc 1.5");
        return;
      }
      await buyTokens(tokenAddr, amount);
      break;
      
    default:
      console.log("Available commands:");
      console.log("  balances           - Check all treasury balances");
      console.log("  buyNFT <id>        - Buy an NFT from marketplace");
      console.log("  buyTokens <addr> <amt> - Buy tokens (weekly)");
      console.log("\nExamples:");
      console.log("  npx hardhat run scripts/admin-functions.js balances --network hyperliquidTestnet");
      console.log("  npx hardhat run scripts/admin-functions.js buyNFT 5 --network hyperliquidTestnet");
      console.log("  npx hardhat run scripts/admin-functions.js buyTokens 0x123...abc 1.5 --network hyperliquidTestnet");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });