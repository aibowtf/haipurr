import React, { useState } from 'react';

export default function PasswordGate({ onCorrectPassword }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Change this password to whatever you want
    const correctPassword = process.env.NEXT_PUBLIC_ACCESS_PASSWORD || 'hypurr2025';
    
    if (password === correctPassword) {
      onCorrectPassword();
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
      <div className="bg-[#151d2f] border border-[#1f2937] rounded-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-[#00d4aa] mb-2 text-center">
          Hypurr Marketplace
        </h1>
        <p className="text-gray-400 text-sm mb-6 text-center">Private Access</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:border-[#00d4aa]"
            autoFocus
          />
          
          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}
          
          <button
            type="submit"
            className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] text-black py-3 rounded-lg font-semibold transition"
          >
            Access Marketplace
          </button>
        </form>
      </div>
    </div>
  );
}
