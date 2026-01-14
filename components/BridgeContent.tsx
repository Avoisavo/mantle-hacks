import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { 
  useAccount, 
  useBalance, 
  useSwitchChain, 
  usePublicClient, 
  useWalletClient,
  useReadContract
} from 'wagmi';
import { sepolia, mantleSepoliaTestnet } from 'wagmi/chains';
import { parseEther, formatEther, erc20Abi, formatUnits } from 'viem';
import { ethers } from 'ethers';
import { 
  L1_CHAIN_ID, 
  L2_CHAIN_ID, 
  L1_MNT_TOKEN_ADDRESS, 
  L2_MNT_TOKEN_ADDRESS 
} from '@/utils/address';
import { 
  publicClientToProvider, 
  walletClientToSigner, 
  createMessenger,
  getExplorerUrl 
} from '../lib/bridge';

export default function BridgeContent() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('10');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'approving' | 'depositing' | 'relaying' | 'done' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');

  // L1 Balances
  const { data: ethBalance } = useBalance({
    address,
    chainId: L1_CHAIN_ID,
  });

  // MNT Balance using useReadContract for better compatibility
  const { data: mntBalanceRaw } = useReadContract({
    address: L1_MNT_TOKEN_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: L1_CHAIN_ID,
  });

  const mntBalanceFormatted = useMemo(() => {
    if (!mntBalanceRaw) return '0.00';
    return parseFloat(formatEther(mntBalanceRaw)).toFixed(2);
  }, [mntBalanceRaw]);

  // L2 Balance for completion check
  const { data: l2MntBalance, refetch: refetchL2Balance } = useBalance({
    address,
    chainId: L2_CHAIN_ID,
  });

  const l1PublicClient = usePublicClient({ chainId: L1_CHAIN_ID });
  const l2PublicClient = usePublicClient({ chainId: L2_CHAIN_ID });
  const { data: walletClient } = useWalletClient({ chainId: L1_CHAIN_ID });

  const handleBridge = async () => {
    if (!walletClient || !l1PublicClient || !l2PublicClient) {
      setErrorMessage('Clients not initialized');
      return;
    }

    try {
      setErrorMessage('');
      setIsBridging(true);
      setBridgeStatus('approving');

      const l1Provider = publicClientToProvider(l1PublicClient);
      const l2Provider = publicClientToProvider(l2PublicClient);
      const l1Signer = walletClientToSigner(walletClient);

      const messenger = createMessenger(l1Signer, l2Provider);

      const amountWei = parseEther(amount).toString();

      // 1. Approve
      console.log('Checking allowance...');
      // In @mantleio/sdk, the method is named 'approval'
      const currentAllowance = await messenger.approval(L1_MNT_TOKEN_ADDRESS, L2_MNT_TOKEN_ADDRESS);
      
      // ethers v5 BigNumber has .lt()
      const currentAllowanceBN = (typeof currentAllowance === 'boolean') 
        ? (currentAllowance ? ethers.constants.MaxUint256 : ethers.constants.Zero)
        : currentAllowance;

      if (currentAllowanceBN.lt(amountWei)) {
        console.log('Approving...');
        const approveTx = await messenger.approveERC20(L1_MNT_TOKEN_ADDRESS, L2_MNT_TOKEN_ADDRESS, amountWei);
        setTxHash(approveTx.hash);
        await approveTx.wait();
        console.log('Approved!');
      }

      // 2. Deposit
      setBridgeStatus('depositing');
      console.log('Depositing MNT...');
      // depositMNT handles the L1 ERC20 -> L2 Native conversion correctly.
      const depositTx = await messenger.depositMNT(amountWei);
      setTxHash(depositTx.hash);
      await depositTx.wait();
      console.log('Deposited!');

      // 3. Relay
      setBridgeStatus('relaying');
      console.log('Waiting for relay (this usually takes 5-10 mins)...');
      
      try {
        await messenger.waitForMessageStatus(depositTx, 3, {
          pollIntervalMs: 30000, // Poll less frequently to avoid RPC rate limits
        }); 
        setBridgeStatus('done');
      } catch (logErr) {
        console.warn("Status check encountered an RPC error or range limit. Switching to manual balance polling.", logErr);
      }
      
      setIsBridging(false);
      refetchL2Balance();

    } catch (err: any) {
      console.error('Bridge Error Detail:', err);
      const msg = err.reason || err.message || 'Bridge failed';
      setErrorMessage(msg);
      setBridgeStatus('error');
      setIsBridging(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bridgeStatus === 'relaying' || bridgeStatus === 'depositing') {
      interval = setInterval(() => {
        console.log("Polling L2 balance...");
        refetchL2Balance();
      }, 15000); // 15 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bridgeStatus, refetchL2Balance]);

  const [initialL2Balance, setInitialL2Balance] = useState<bigint | null>(null);
  
  useEffect(() => {
    if (bridgeStatus === 'idle' && l2MntBalance) {
      setInitialL2Balance(l2MntBalance.value);
    }
  }, [l2MntBalance, bridgeStatus]);

  useEffect(() => {
    if (bridgeStatus === 'relaying' && l2MntBalance && initialL2Balance !== null) {
      if (l2MntBalance.value > initialL2Balance) {
        console.log("Detecting balance increase! Bridge complete.");
        setBridgeStatus('done');
      }
    }
  }, [l2MntBalance, bridgeStatus, initialL2Balance]);

  const isL1 = chainId === L1_CHAIN_ID;
  const ethBalanceVal = ethBalance ? parseFloat(formatEther(ethBalance.value)) : 0;
  const mntBalanceVal = mntBalanceRaw ? parseFloat(formatEther(mntBalanceRaw)) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Mantle Bridge Wizard
          </h1>
          <p className="text-gray-400 mt-2">Bridge Sepolia MNT to Mantle Sepolia</p>
        </header>

        <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl">
          {/* Stepper */}
          <div className="flex justify-between mb-8">
            <div className={`flex-1 text-center pb-4 border-b-2 ${step >= 1 ? 'border-emerald-500 text-emerald-500' : 'border-gray-800 text-gray-500'}`}>
              1. Check Balances
            </div>
            <div className={`flex-1 text-center pb-4 border-b-2 ${step >= 2 ? 'border-emerald-500 text-emerald-500' : 'border-gray-800 text-gray-500'}`}>
              2. Bridge MNT
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-[#1c1c1c] rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4 text-gray-200">Ethereum Sepolia Balances</h3>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-400">Sepolia ETH</span>
                  <span className="font-mono text-emerald-400">{ethBalanceVal.toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Sepolia MNT (ERC-20)</span>
                  <span className="font-mono text-emerald-400">{mntBalanceFormatted} MNT</span>
                </div>
              </div>

              {!isL1 ? (
                <button 
                  onClick={() => switchChain({ chainId: L1_CHAIN_ID })}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                >
                  Switch to Ethereum Sepolia
                </button>
              ) : (
                <button 
                  onClick={() => setStep(2)}
                  disabled={mntBalanceVal < 0.1 || ethBalanceVal < 0.005}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
                >
                  Continue to Bridge
                </button>
              )}
              
              {mntBalanceRaw !== undefined && mntBalanceVal < 0.1 && (
                <p className="text-amber-400 text-sm text-center">You need at least 0.1 MNT on Ethereum Sepolia to bridge.</p>
              )}
              {ethBalance !== undefined && ethBalanceVal < 0.005 && (
                <p className="text-amber-400 text-sm text-center">You need some Sepolia ETH for gas.</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-[#1c1c1c] rounded-xl p-6 border border-gray-800">
                <label className="block text-gray-400 mb-2">Amount to Bridge (MNT)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-2xl font-mono text-white focus:outline-none focus:border-emerald-500"
                  disabled={isBridging || bridgeStatus === 'done'}
                />
              </div>

              {bridgeStatus === 'idle' && (
                <button 
                  onClick={handleBridge}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-cyan-900/20"
                >
                  Start Bridging
                </button>
              )}

              {bridgeStatus !== 'idle' && bridgeStatus !== 'done' && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
                  <p className="text-xl font-medium text-emerald-400">
                    {bridgeStatus === 'approving' && 'Step 1/2: Approving MNT...'}
                    {bridgeStatus === 'depositing' && 'Step 2/2: Confirming Deposit...'}
                    {bridgeStatus === 'relaying' && 'Verification in progress: Relaying to Mantle...'}
                  </p>
                  {txHash && (
                    <a 
                      href={getExplorerUrl(L1_CHAIN_ID, txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-500 hover:underline mt-2 block text-sm"
                    >
                      View on Etherscan
                    </a>
                  )}
                </div>
              )}

              {bridgeStatus === 'done' && (
                <div className="text-center py-6 bg-emerald-900/20 border border-emerald-800 rounded-xl">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-emerald-400 mb-2">Bridge Successful!</h3>
                  <p className="text-gray-300 mb-6">Your MNT has arrived on Mantle Sepolia.</p>
                  <p className="text-sm text-gray-400 mb-4 font-mono">
                    New Balance: {l2MntBalance ? `${parseFloat(formatEther(l2MntBalance.value)).toFixed(2)} MNT` : 'Updating...'}
                  </p>
                  <button 
                    onClick={() => switchChain({ chainId: L2_CHAIN_ID })}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all"
                  >
                    Switch to Mantle Sepolia
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm break-words">
                  {errorMessage}
                </div>
              )}

              <button 
                onClick={() => setStep(1)}
                className="w-full py-2 text-gray-500 hover:text-gray-300 transition-colors text-sm"
                disabled={isBridging && bridgeStatus !== 'error'}
              >
                ← Back to balances
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
