import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ArrowDownUp, Loader } from 'lucide-react';
import config from '../config';

const WHYPE_ADDRESS = config.contracts.wHYPE;

const WHYPE_ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

export default function WHYPEWrapper({ provider, account, onBalanceUpdate }) {
  const [hypeBalance, setHypeBalance] = useState('0');
  const [whypeBalance, setWhypeBalance] = useState('0');
  const [wrapAmount, setWrapAmount] = useState('');
  const [unwrapAmount, setUnwrapAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('wrap'); // 'wrap' or 'unwrap'

  useEffect(() => {
    if (provider && account) {
      loadBalances();
    }
  }, [provider, account]);

  const loadBalances = async () => {
    try {
      // Get native HYPE balance
      const hype = await provider.getBalance(account);
      setHypeBalance(ethers.formatEther(hype));

      // Get wHYPE balance
      const whypeContract = new ethers.Contract(WHYPE_ADDRESS, WHYPE_ABI, provider);
      const whype = await whypeContract.balanceOf(account);
      setWhypeBalance(ethers.formatEther(whype));

      if (onBalanceUpdate) {
        onBalanceUpdate({
          hype: ethers.formatEther(hype),
          whype: ethers.formatEther(whype)
        });
      }
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const handleWrap = async () => {
    if (!wrapAmount || parseFloat(wrapAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(wrapAmount) > parseFloat(hypeBalance)) {
      alert('Insufficient HYPE balance');
      return;
    }

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const whypeContract = new ethers.Contract(WHYPE_ADDRESS, WHYPE_ABI, signer);

      const amount = ethers.parseEther(wrapAmount);
      const tx = await whypeContract.deposit({ value: amount });
      
      console.log('Wrapping HYPE...', tx.hash);
      await tx.wait();
      
      alert(`Successfully wrapped ${wrapAmount} HYPE!`);
      setWrapAmount('');
      await loadBalances();
    } catch (error) {
      console.error('Error wrapping:', error);
      alert('Error wrapping HYPE: ' + error.message);
    }
    setLoading(false);
  };

  const handleUnwrap = async () => {
    if (!unwrapAmount || parseFloat(unwrapAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(unwrapAmount) > parseFloat(whypeBalance)) {
      alert('Insufficient wHYPE balance');
      return;
    }

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const whypeContract = new ethers.Contract(WHYPE_ADDRESS, WHYPE_ABI, signer);

      const amount = ethers.parseEther(unwrapAmount);
      const tx = await whypeContract.withdraw(amount);
      
      console.log('Unwrapping wHYPE...', tx.hash);
      await tx.wait();
      
      alert(`Successfully unwrapped ${unwrapAmount} wHYPE!`);
      setUnwrapAmount('');
      await loadBalances();
    } catch (error) {
      console.error('Error unwrapping:', error);
      alert('Error unwrapping wHYPE: ' + error.message);
    }
    setLoading(false);
  };

  const setMaxWrap = () => {
    // Leave some HYPE for gas
    const maxAmount = Math.max(0, parseFloat(hypeBalance) - 0.01);
    setWrapAmount(maxAmount.toFixed(4));
  };

  const setMaxUnwrap = () => {
    setUnwrapAmount(whypeBalance);
  };

  return (
    <div className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <ArrowDownUp size={20} className="text-purple-400" />
          Wrap / Unwrap HYPE
        </h3>
        <button
          onClick={loadBalances}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Refresh
        </button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">HYPE Balance</p>
          <p className="text-2xl font-bold text-purple-400">
            {parseFloat(hypeBalance).toFixed(4)}
          </p>
        </div>
        <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">wHYPE Balance</p>
          <p className="text-2xl font-bold text-pink-400">
            {parseFloat(whypeBalance).toFixed(4)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setAction('wrap')}
          className={`flex-1 py-2 rounded-lg font-semibold transition ${
            action === 'wrap'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Wrap
        </button>
        <button
          onClick={() => setAction('unwrap')}
          className={`flex-1 py-2 rounded-lg font-semibold transition ${
            action === 'unwrap'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Unwrap
        </button>
      </div>

      {/* Wrap Form */}
      {action === 'wrap' && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-400">Amount to Wrap</label>
              <button
                onClick={setMaxWrap}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                MAX
              </button>
            </div>
            <input
              type="number"
              step="0.0001"
              placeholder="0.0"
              value={wrapAmount}
              onChange={(e) => setWrapAmount(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-lg focus:border-purple-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              HYPE → wHYPE (1:1 ratio)
            </p>
          </div>
          <button
            onClick={handleWrap}
            disabled={loading || !wrapAmount}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Wrapping...
              </>
            ) : (
              'Wrap HYPE'
            )}
          </button>
          <p className="text-xs text-gray-400 text-center">
            💡 Wrap HYPE to make offers on NFTs
          </p>
        </div>
      )}

      {/* Unwrap Form */}
      {action === 'unwrap' && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-400">Amount to Unwrap</label>
              <button
                onClick={setMaxUnwrap}
                className="text-xs text-pink-400 hover:text-pink-300"
              >
                MAX
              </button>
            </div>
            <input
              type="number"
              step="0.0001"
              placeholder="0.0"
              value={unwrapAmount}
              onChange={(e) => setUnwrapAmount(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-lg focus:border-pink-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              wHYPE → HYPE (1:1 ratio)
            </p>
          </div>
          <button
            onClick={handleUnwrap}
            disabled={loading || !unwrapAmount}
            className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Unwrapping...
              </>
            ) : (
              'Unwrap wHYPE'
            )}
          </button>
          <p className="text-xs text-gray-400 text-center">
            💡 Unwrap wHYPE back to native HYPE anytime
          </p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg">
        <p className="text-xs text-blue-300">
          <strong>ℹ️ How it works:</strong>
          <br />• Wrap HYPE to get wHYPE for making offers
          <br />• Unwrap wHYPE to get your HYPE back
          <br />• 1 wHYPE always equals 1 HYPE
        </p>
      </div>
    </div>
  );
}
