import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TrendingUp, Activity, Filter, X, Clock, Tag, DollarSign, Users } from 'lucide-react';
import config from '../config';
import WHYPEWrapper from '../components/WHYPEWrapper';
import PasswordGate from '../components/PasswordGate'; 

// Use config for contract addresses
const HYPURR_NFT_ADDRESS = config.contracts.hypurrNFT;
const MARKETPLACE_ADDRESS = config.contracts.marketplace;
const WHYPE_ADDRESS = config.contracts.wHYPE;

const MARKETPLACE_ABI = [
  "function list(uint256 tokenId, uint256 price) external",
  "function unlist(uint256 tokenId) external",
  "function buy(uint256 tokenId) external payable",
  "function makeOffer(uint256 tokenId, uint256 price, uint256 duration) external",
  "function cancelOffer(uint256 tokenId) external",
  "function acceptOffer(uint256 tokenId, address offerer) external",
  "function listings(uint256) external view returns (address seller, uint256 price, bool active)",
  "function offers(uint256, address) external view returns (address offerer, uint256 price, uint256 expiresAt, bool active)",
  "function getActiveOffers(uint256 tokenId) external view returns (address[] memory, uint256[] memory, uint256[] memory)",
  "event Listed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event Unlisted(uint256 indexed tokenId, address indexed seller)",
  "event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 fee)",
  "event OfferMade(uint256 indexed tokenId, address indexed offerer, uint256 price, uint256 expiresAt)",
  "event OfferAccepted(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 fee)"
];

const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function approve(address to, uint256 tokenId) external",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function totalSupply() external view returns (uint256)"
];

const WHYPE_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

export default function HypurrMarketplace() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [myNfts, setMyNfts] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('tokenId');
  const [loading, setLoading] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState({});
  const [allTraits, setAllTraits] = useState([]);
  const [showTraitFilter, setShowTraitFilter] = useState(false);
  const [whypeBalance, setWhypeBalance] = useState('0');
  const [hypeBalance, setHypeBalance] = useState('0');
  const [analytics, setAnalytics] = useState({
    floorPrice: 0,
    volume24h: 0,
    totalSales: 0,
    avgPrice: 0,
    totalListings: 0
  });
  const [currentTab, setCurrentTab] = useState('marketplace');

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
    }
  }, []);

  const connectWallet = async () => {
    try {
      // Check if on correct network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainId, 16) !== config.network.chainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${config.network.chainId.toString(16)}` }],
          });
        } catch (switchError) {
          // Network not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${config.network.chainId.toString(16)}`,
                chainName: config.network.name,
                nativeCurrency: {
                  name: config.network.currency,
                  symbol: config.network.currency,
                  decimals: 18
                },
                rpcUrls: [config.network.rpc],
                blockExplorerUrls: [config.network.explorer]
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await loadData(accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert(`Please connect to ${config.network.name} (Chain ID: ${config.network.chainId})`);
    }
  };

  const loadData = async (userAddress) => {
    if (!provider) return;
    
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const nftContract = new ethers.Contract(HYPURR_NFT_ADDRESS, ERC721_ABI, signer);
      const whypeContract = new ethers.Contract(WHYPE_ADDRESS, WHYPE_ABI, signer);

      // Load balances
      console.log('=== Loading NFT Data ===');
      console.log('NFT Contract:', HYPURR_NFT_ADDRESS);
      console.log('Marketplace Contract:', MARKETPLACE_ADDRESS);
      console.log('User Address:', userAddress);
      
      // Load balances
      try {
        const hype = await provider.getBalance(userAddress);
        setHypeBalance(ethers.formatEther(hype));
        console.log('HYPE Balance:', ethers.formatEther(hype));
      } catch (e) {
        console.error('Error loading HYPE balance:', e.message);
        setHypeBalance('0');
      }
      
      try {
        const whype = await whypeContract.balanceOf(userAddress);
        setWhypeBalance(ethers.formatEther(whype));
        console.log('wHYPE Balance:', ethers.formatEther(whype));
      } catch (e) {
        console.error('Error loading wHYPE balance:', e.message);
        setWhypeBalance('0');
      }
      console.log('NFT Contract:', HYPURR_NFT_ADDRESS);
      console.log('Marketplace Contract:', MARKETPLACE_ADDRESS);
      console.log('User Address:', userAddress);
      
      const balance = await nftContract.balanceOf(userAddress);
      console.log(`You own ${balance} NFTs`);
      const userTokens = [];

      // Since tokenOfOwnerByIndex doesn't work, we'll check ownership of tokens 0-99
      for (let tokenId = 0; tokenId < 100; tokenId++) {
        try {
          const owner = await nftContract.ownerOf(tokenId);
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            console.log(`You own NFT #${tokenId}`);
            userTokens.push(tokenId);
          }
        } catch (e) {
          // Token doesn't exist or error
        }
      }

      console.log('Your NFT token IDs:', userTokens);
      setMyNfts(userTokens);
      // Load listings and metadata (for 100 test NFTs)
      // Load listings and metadata
      const allNfts = [];
      const traits = [];
      let totalVolume = 0;
      let salesCount = 0;
      let lowestPrice = Infinity;

      // Get total supply from contract
      let totalSupply = 100; // default
      try {
        totalSupply = Number(await nftContract.totalSupply());
        console.log(`Total NFT supply: ${totalSupply}`);
      } catch (e) {
        console.log('Could not fetch total supply, defaulting to 100');
      }

      for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
        try {
          const owner = await nftContract.ownerOf(tokenId);
          const listing = await marketplaceContract.listings(tokenId);
          const metadata = await fetchMetadata(nftContract, tokenId);
          
          if (metadata?.attributes) {
            traits.push(...metadata.attributes);
          }
          
          const nftData = {
            tokenId,
            owner,
            seller: listing.active ? listing.seller : null,
            price: listing.active ? ethers.formatEther(listing.price) : null,
            listed: listing.active,
            metadata
          };
          
          if (listing.active) {
            const price = parseFloat(ethers.formatEther(listing.price));
            if (price < lowestPrice) lowestPrice = price;
          }
          
          allNfts.push(nftData);
        } catch (e) {
          // Token doesn't exist or error loading
          console.log(`Token ${tokenId} not found or error:`, e.message);
        }
      }
      
      console.log(`Loaded ${allNfts.length} total NFTs`);
      console.log(`Your NFTs that were found:`, allNfts.filter(n => userTokens.includes(n.tokenId)));
      
      setNfts(allNfts);
      setAllTraits(traits);
      
      // Load activity feed
      await loadActivityFeed(marketplaceContract);
      
      // Load user's offers
      await loadUserOffers(marketplaceContract, userAddress, allNfts);
      
      // Calculate analytics
      setAnalytics({
        floorPrice: lowestPrice === Infinity ? 0 : lowestPrice,
        volume24h: totalVolume,
        totalSales: salesCount,
        avgPrice: salesCount > 0 ? totalVolume / salesCount : 0,
        totalListings: allNfts.filter(n => n.listed).length
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const fetchMetadata = async (nftContract, tokenId) => {
    try {
      const uri = await nftContract.tokenURI(tokenId);
      const ipfsUrl = config.ipfsToHttp(uri);
      const response = await fetch(ipfsUrl);
      return await response.json();
    } catch {
      return { name: `Hypurr #${tokenId}`, attributes: [] };
    }
  };

  const loadActivityFeed = async (marketplaceContract) => {
    try {
      const latestBlock = await provider.getBlockNumber();
      const filter = marketplaceContract.filters;
      
      const soldEvents = await marketplaceContract.queryFilter(
        filter.Sold(),
        latestBlock - 1000,
        latestBlock
      );
      
      const listedEvents = await marketplaceContract.queryFilter(
        filter.Listed(),
        latestBlock - 1000,
        latestBlock
      );
      
      const offerEvents = await marketplaceContract.queryFilter(
        filter.OfferMade(),
        latestBlock - 1000,
        latestBlock
      );
      
      const activities = [
        ...soldEvents.map(e => ({
          type: 'sale',
          tokenId: Number(e.args.tokenId),
          from: e.args.seller,
          to: e.args.buyer,
          price: ethers.formatEther(e.args.price),
          timestamp: Date.now() - Math.random() * 86400000
        })),
        ...listedEvents.map(e => ({
          type: 'listing',
          tokenId: Number(e.args.tokenId),
          from: e.args.seller,
          price: ethers.formatEther(e.args.price),
          timestamp: Date.now() - Math.random() * 86400000
        })),
        ...offerEvents.map(e => ({
          type: 'offer',
          tokenId: Number(e.args.tokenId),
          from: e.args.offerer,
          price: ethers.formatEther(e.args.price),
          timestamp: Date.now() - Math.random() * 86400000
        }))
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
      
      setActivityFeed(activities);
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const loadUserOffers = async (marketplaceContract, userAddress, allNfts) => {
    const offers = [];
    
    for (const nft of allNfts) {
      try {
        const offer = await marketplaceContract.offers(nft.tokenId, userAddress);
        if (offer.active && offer.expiresAt > Date.now() / 1000) {
          offers.push({
            tokenId: nft.tokenId,
            price: ethers.formatEther(offer.price),
            expiresAt: Number(offer.expiresAt) * 1000
          });
        }
      } catch (e) {}
    }
    
    setMyOffers(offers);
  };

  const listNFT = async (tokenId, price) => {
    try {
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const nftContract = new ethers.Contract(HYPURR_NFT_ADDRESS, ERC721_ABI, signer);

      const tx1 = await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);
      await tx1.wait();

      const priceWei = ethers.parseEther(price);
      const tx2 = await marketplaceContract.list(tokenId, priceWei);
      await tx2.wait();

      alert('NFT listed successfully!');
      await loadData(account);
    } catch (error) {
      console.error('Error listing NFT:', error);
      alert('Error listing NFT');
    }
  };

  const buyNFT = async (tokenId, price) => {
    try {
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      
      const priceWei = ethers.parseEther(price);
      const tx = await marketplaceContract.buy(tokenId, { value: priceWei });
      await tx.wait();

      alert('NFT purchased successfully!');
      await loadData(account);
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Error buying NFT');
    }
  };

  const makeOffer = async (tokenId, offerPrice, duration) => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      alert('Please enter a valid offer price');
      return;
    }

    if (parseFloat(offerPrice) > parseFloat(whypeBalance)) {
      alert(`Insufficient wHYPE balance. You have ${parseFloat(whypeBalance).toFixed(4)} wHYPE. Please wrap more HYPE first.`);
      return;
    }

    try {
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const whypeContract = new ethers.Contract(WHYPE_ADDRESS, WHYPE_ABI, signer);

      const priceWei = ethers.parseEther(offerPrice);
      const durationSeconds = duration * 24 * 60 * 60;

      // Check and approve wHYPE if needed
      const allowance = await whypeContract.allowance(account, MARKETPLACE_ADDRESS);
      
      if (allowance < priceWei) {
        console.log('Approving wHYPE...');
        const approveTx = await whypeContract.approve(MARKETPLACE_ADDRESS, priceWei);
        await approveTx.wait();
        console.log('wHYPE approved');
      }

      // Make offer (no value sent, wHYPE is transferred)
      console.log('Making offer...');
      const tx = await marketplaceContract.makeOffer(tokenId, priceWei, durationSeconds);
      await tx.wait();

      alert('Offer made successfully with wHYPE!');
      await loadData(account);
    } catch (error) {
      console.error('Error making offer:', error);
      alert('Error making offer: ' + error.message);
    }
  };

  const cancelOffer = async (tokenId) => {
    try {
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      
      const tx = await marketplaceContract.cancelOffer(tokenId);
      await tx.wait();

      alert('Offer cancelled successfully!');
      await loadData(account);
    } catch (error) {
      console.error('Error cancelling offer:', error);
      alert('Error cancelling offer');
    }
  };

  const acceptOffer = async (tokenId, offerer) => {
    try {
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      
      const tx = await marketplaceContract.acceptOffer(tokenId, offerer);
      await tx.wait();

      alert('Offer accepted successfully!');
      await loadData(account);
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Error accepting offer');
    }
  };

  const handleTraitToggle = (traitType, value) => {
    setSelectedTraits(prev => {
      const current = prev[traitType] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return updated.length > 0 ? { ...prev, [traitType]: updated } : 
        Object.fromEntries(Object.entries(prev).filter(([k]) => k !== traitType));
    });
  };

  const filteredNfts = nfts.filter(nft => {
    if (filter === 'myListings') return nft.seller?.toLowerCase() === account.toLowerCase();
    if (filter === 'myNfts') return nft.owner.toLowerCase() === account.toLowerCase();
    if (filter === 'listed') return nft.listed;
    
    if (Object.keys(selectedTraits).length > 0) {
      return Object.entries(selectedTraits).every(([traitType, values]) => {
        const nftTrait = nft.metadata?.attributes?.find(attr => attr.trait_type === traitType);
        return nftTrait && values.includes(nftTrait.value);
      });
    }
    
    return true;
  });

  const sortedNfts = [...filteredNfts].sort((a, b) => {
    if (sortBy === 'priceLow') return (parseFloat(a.price) || Infinity) - (parseFloat(b.price) || Infinity);
    if (sortBy === 'priceHigh') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    return a.tokenId - b.tokenId;
  });

  const traitTypes = [...new Set(allTraits.map(t => t.trait_type))];

  // Marketplace fee is 0.4%
  const marketplaceFee = 0.004;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold text-[#00d4aa]">
              Hypurr Marketplace
            </h1>
            {config.isTestnet && (
              <p className="text-yellow-400 text-sm mt-2">⚠️ TESTNET MODE - {config.network.name}</p>
            )}
          </div>
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-[#00d4aa] hover:bg-[#00bfa0] text-black px-6 py-3 rounded-lg font-semibold transition"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="text-right bg-[#151d2f] px-6 py-4 rounded-lg border border-[#1f2937]">
              <p className="text-sm text-gray-400 mb-2">Connected</p>
              <p className="font-mono text-sm mb-3">{account.slice(0, 6)}...{account.slice(-4)}</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">HYPE:</span>
                  <span className="font-semibold text-[#00d4aa]">{parseFloat(hypeBalance).toFixed(4)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">wHYPE:</span>
                  <span className="font-semibold text-[#00d4aa]">{parseFloat(whypeBalance).toFixed(4)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Fee: 0.4%</p>
            </div>
          )}
        </div>

        {account && (
          <>
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <AnalyticCard icon={<DollarSign size={20} />} label="Floor Price" value={`${analytics.floorPrice.toFixed(3)} ${config.network.currency}`} />
              <AnalyticCard icon={<TrendingUp size={20} />} label="24h Volume" value={`${analytics.volume24h.toFixed(2)} ${config.network.currency}`} />
              <AnalyticCard icon={<Activity size={20} />} label="Total Sales" value={analytics.totalSales} />
              <AnalyticCard icon={<Tag size={20} />} label="Avg Price" value={`${analytics.avgPrice.toFixed(3)} ${config.network.currency}`} />
              <AnalyticCard icon={<Users size={20} />} label="Listed" value={analytics.totalListings} />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-[#1f2937]">
              <TabButton active={currentTab === 'marketplace'} onClick={() => setCurrentTab('marketplace')}>Marketplace</TabButton>
              <TabButton active={currentTab === 'myNfts'} onClick={() => setCurrentTab('myNfts')}>My NFTs ({myNfts.length})</TabButton>
              <TabButton active={currentTab === 'offers'} onClick={() => setCurrentTab('offers')}>My Offers ({myOffers.length})</TabButton>
              <TabButton active={currentTab === 'wrap'} onClick={() => setCurrentTab('wrap')}>Wrap HYPE</TabButton>
              <TabButton active={currentTab === 'activity'} onClick={() => setCurrentTab('activity')}>Activity</TabButton>
            </div>

            {currentTab === 'marketplace' && (
              <>
                {/* Filters */}
                <div className="flex gap-4 mb-6 flex-wrap items-center">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
                  >
                    <option value="all">All NFTs</option>
                    <option value="listed">Listed Only</option>
                    <option value="myListings">My Listings</option>
                    <option value="myNfts">My NFTs</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
                  >
                    <option value="tokenId">Token ID</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="priceHigh">Price: High to Low</option>
                  </select>

                  <button
                    onClick={() => setShowTraitFilter(!showTraitFilter)}
                    className="bg-gray-800 border border-gray-700 hover:border-purple-500 px-4 py-2 rounded-lg transition flex items-center gap-2"
                  >
                    <Filter size={16} />
                    Traits {Object.keys(selectedTraits).length > 0 && `(${Object.values(selectedTraits).flat().length})`}
                  </button>

                  <button
                    onClick={() => loadData(account)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
                  >
                    Refresh
                  </button>
                </div>

                {/* Trait Filter Panel */}
                {showTraitFilter && (
                  <TraitFilterPanel 
                    traits={allTraits} 
                    traitTypes={traitTypes}
                    selectedTraits={selectedTraits}
                    onToggle={handleTraitToggle}
                    onClose={() => setShowTraitFilter(false)}
                  />
                )}

                {/* NFT Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {loading ? (
                    <p className="text-gray-400">Loading...</p>
                  ) : sortedNfts.length === 0 ? (
                    <p className="text-gray-400">No NFTs found</p>
                  ) : (
                    sortedNfts.map(nft => (
                      <NFTCard
                        key={nft.tokenId}
                        nft={nft}
                        account={account}
                        marketplaceFee={marketplaceFee}
                        currency={config.network.currency}
                        whypeBalance={whypeBalance}
                        onBuy={buyNFT}
                        onMakeOffer={makeOffer}
                        onAcceptOffer={acceptOffer}
                      />
                    ))
                  )}
                </div>
              </>
            )}

            {currentTab === 'myNfts' && (
              <div>
                {myNfts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-xl mb-2">No NFTs found</p>
                    <p className="text-sm">You don't own any Hypurr NFTs yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myNfts.map(tokenId => {
                      const nft = nfts.find(n => n.tokenId === tokenId);
                      return (
                        <NFTListCard 
                          key={tokenId} 
                          tokenId={tokenId}
                          nft={nft}
                          onList={listNFT} 
                          currency={config.network.currency} 
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {currentTab === 'offers' && (
              <OffersPanel offers={myOffers} onCancel={cancelOffer} currency={config.network.currency} />
            )}

            {currentTab === 'wrap' && (
              <div className="max-w-md mx-auto">
                <WHYPEWrapper 
                  provider={provider} 
                  account={account}
                  onBalanceUpdate={(balances) => {
                    setWhypeBalance(balances.whype);
                  }}
                />
              </div>
            )}

            {currentTab === 'activity' && (
              <ActivityFeed activities={activityFeed} currency={config.network.currency} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AnalyticCard({ icon, label, value }) {
  return (
    <div className="bg-[#151d2f] border border-[#1f2937] rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#00d4aa]">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 px-2 font-semibold transition ${
        active ? 'text-[#00d4aa] border-b-2 border-[#00d4aa]' : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function TraitFilterPanel({ traits, traitTypes, selectedTraits, onToggle, onClose }) {
  return (
    <div className="mb-6 p-6 bg-gray-800 bg-opacity-50 rounded-xl border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Filter by Traits</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {traitTypes.map(traitType => {
          const values = [...new Set(traits.filter(t => t.trait_type === traitType).map(t => t.value))];
          
          return (
            <div key={traitType}>
              <p className="font-semibold text-purple-400 mb-3">{traitType}</p>
              <div className="space-y-2">
                {values.map(value => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer hover:text-purple-400 transition">
                    <input
                      type="checkbox"
                      checked={selectedTraits[traitType]?.includes(value)}
                      onChange={() => onToggle(traitType, value)}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    <span className="text-sm">{value}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NFTListCard({ tokenId, nft, onList, currency }) {
  const [price, setPrice] = useState('');
  const [showListForm, setShowListForm] = useState(false);

  const handleList = () => {
    if (!price || parseFloat(price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    onList(tokenId, price);
    setPrice('');
    setShowListForm(false);
  };

  return (
    <div className="bg-[#151d2f] border border-[#1f2937] rounded-xl p-6">
      <div className="aspect-square bg-gradient-to-br from-[#00d4aa] to-[#0088cc] rounded-lg flex items-center justify-center mb-4">
        <p className="text-4xl font-bold text-black">#{tokenId}</p>
      </div>
      <p className="font-bold mb-3">{nft?.metadata?.name || `Hypurr #${tokenId}`}</p>
      
      {nft?.listed ? (
        <div className="text-center">
          <p className="text-[#00d4aa] text-xl font-bold mb-2">{nft.price} {currency}</p>
          <p className="text-gray-400 text-sm">Already Listed</p>
        </div>
      ) : (
        <>
          {!showListForm ? (
            <button
              onClick={() => setShowListForm(true)}
              className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-black py-2 rounded-lg transition font-semibold"
            >
              List for Sale
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="number"
                step="0.01"
                placeholder={`Price in ${currency}`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-2 text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleList}
                  className="flex-1 bg-[#00d4aa] hover:bg-[#00bfa0] text-black py-2 rounded-lg transition font-semibold"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowListForm(false);
                    setPrice('');
                  }}
                  className="flex-1 bg-[#1f2937] hover:bg-[#2d3748] py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NFTCard({ nft, account, marketplaceFee, currency, whypeBalance, onBuy, onMakeOffer, onAcceptOffer }) {
  const [showOffer, setShowOffer] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDuration, setOfferDuration] = useState('7');
  const [activeOffers, setActiveOffers] = useState([]);

  const isOwner = nft.owner.toLowerCase() === account.toLowerCase();
  const fee = parseFloat(nft.price || 0) * marketplaceFee;

  const loadOffers = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
      const [offerers, prices, expirations] = await contract.getActiveOffers(nft.tokenId);
      
      const offers = offerers.map((addr, i) => ({
        offerer: addr,
        price: ethers.formatEther(prices[i]),
        expiresAt: Number(expirations[i]) * 1000
      }));
      
      setActiveOffers(offers);
    } catch (e) {
      console.error('Error loading offers:', e);
    }
  };

  const handleMakeOffer = () => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      alert('Please enter a valid offer price');
      return;
    }
    onMakeOffer(nft.tokenId, offerPrice, parseInt(offerDuration));
    setOfferPrice('');
    setShowOffer(false);
  };

  return (
    <div className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl overflow-hidden hover:border-purple-500 transition">
      <div className="aspect-square bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
        <p className="text-5xl font-bold">#{nft.tokenId}</p>
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{nft.metadata?.name || `Hypurr #${nft.tokenId}`}</h3>
        
        {/* Traits */}
        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {nft.metadata.attributes.slice(0, 3).map((attr, i) => (
              <span key={i} className="text-xs bg-purple-900 bg-opacity-50 px-2 py-1 rounded">
                {attr.trait_type}: {attr.value}
              </span>
            ))}
          </div>
        )}
        
        {nft.listed ? (
          <>
            <p className="text-2xl font-bold text-purple-400 mb-1">{nft.price} {currency}</p>
            {fee > 0 && (
              <p className="text-xs text-gray-400 mb-3">+ {fee.toFixed(4)} {currency} fee (0.4%)</p>
            )}
            <p className="text-sm text-gray-400 mb-4">
              Seller: {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
            </p>

            {!isOwner && !showOffer && (
              <div className="space-y-2">
                <button
                  onClick={() => onBuy(nft.tokenId, nft.price)}
                  className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg transition font-semibold"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => setShowOffer(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition font-semibold"
                >
                  Make Offer
                </button>
              </div>
            )}

            {showOffer && (
              <div className="space-y-2">
                <div className="bg-gray-900 p-3 rounded-lg mb-3">
                  <p className="text-xs text-gray-400 mb-1">Your wHYPE Balance</p>
                  <p className="text-lg font-bold text-pink-400">
                    {parseFloat(whypeBalance).toFixed(4)} wHYPE
                  </p>
                  {parseFloat(whypeBalance) === 0 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      ⚠️ Wrap HYPE first to make offers
                    </p>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder={`Offer price (${currency})`}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
                <select
                  value={offerDuration}
                  onChange={(e) => setOfferDuration(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                >
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleMakeOffer}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded transition"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setShowOffer(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isOwner && (
              <>
                <p className="text-center text-gray-500 py-2 mb-2">Your Listing</p>
                <button
                  onClick={() => {
                    loadOffers();
                    setShowOffers(!showOffers);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition"
                >
                  View Offers
                </button>
                
                {showOffers && activeOffers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {activeOffers.map((offer, i) => (
                      <div key={i} className="bg-gray-900 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-purple-400">{offer.price} {currency}</span>
                          <span className="text-xs text-gray-400">
                            <Clock size={12} className="inline mr-1" />
                            {new Date(offer.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          From: {offer.offerer.slice(0, 6)}...{offer.offerer.slice(-4)}
                        </p>
                        <button
                          onClick={() => onAcceptOffer(nft.tokenId, offer.offerer)}
                          className="w-full bg-green-600 hover:bg-green-700 py-1 rounded text-sm transition"
                        >
                          Accept Offer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <p className="text-gray-400 py-4 text-center">Not Listed</p>
        )}
      </div>
    </div>
  );
}

function OffersPanel({ offers, onCancel, currency }) {
  if (offers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-xl mb-2">No active offers</p>
        <p className="text-sm">Make an offer on any NFT to see it here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {offers.map(offer => (
        <div key={offer.tokenId} className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl p-6">
          <div className="aspect-square bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
            <p className="text-4xl font-bold">#{offer.tokenId}</p>
          </div>
          <h3 className="text-xl font-bold mb-2">Hypurr #{offer.tokenId}</h3>
          <p className="text-2xl font-bold text-purple-400 mb-1">{offer.price} {currency}</p>
          <p className="text-sm text-gray-400 mb-4 flex items-center gap-1">
            <Clock size={14} />
            Expires: {new Date(offer.expiresAt).toLocaleDateString()}
          </p>
          <button
            onClick={() => onCancel(offer.tokenId)}
            className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg transition font-semibold"
          >
            Cancel Offer
          </button>
        </div>
      ))}
    </div>
  );
}

function ActivityFeed({ activities, currency }) {
  const getActivityIcon = (type) => {
    switch(type) {
      case 'sale': return '💰';
      case 'listing': return '🏷️';
      case 'offer': return '🤝';
      default: return '📝';
    }
  };

  const getActivityText = (activity) => {
    switch(activity.type) {
      case 'sale':
        return `Hypurr #${activity.tokenId} sold for ${activity.price} ${currency}`;
      case 'listing':
        return `Hypurr #${activity.tokenId} listed for ${activity.price} ${currency}`;
      case 'offer':
        return `Offer of ${activity.price} ${currency} made on Hypurr #${activity.tokenId}`;
      default:
        return 'Activity';
    }
  };

  return (
    <div className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Activity size={20} />
          Recent Activity
        </h3>
      </div>
      <div className="divide-y divide-gray-700">
        {activities.length === 0 ? (
          <p className="p-8 text-center text-gray-400">No recent activity</p>
        ) : (
          activities.map((activity, i) => (
            <div key={i} className="p-4 hover:bg-gray-700 hover:bg-opacity-30 transition">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                <div className="flex-1">
                  <p className="font-semibold">{getActivityText(activity)}</p>
                  <div className="flex items-center gap-4 mt-1">
                    {activity.from && (
                      <p className="text-sm text-gray-400">
                        From: {activity.from.slice(0, 6)}...{activity.from.slice(-4)}
                      </p>
                    )}
                    {activity.to && (
                      <p className="text-sm text-gray-400">
                        To: {activity.to.slice(0, 6)}...{activity.to.slice(-4)}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
