import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
    MNT_TOKEN_ADDRESS,
    TOWN_TOPUP_MANTLE_ADDRESS,
    TOWN_TOKEN_MANTLE_ADDRESS
} from "@/utils/address";
import { ABI as TownTopUpABI } from "@/utils/towntop";
import { ABI as TownTokenABI } from "@/utils/towntoken";
import { ERC20_ABI } from "@/utils/erc20";
import { mantleSepoliaTestnet } from "wagmi/chains";

// Mantle Sepolia Chain ID
const CHAIN_ID = mantleSepoliaTestnet.id; // 5003

export default function TestTopUpMantle() {
    const [mntAmount, setMntAmount] = useState("0.1");
    const [status, setStatus] = useState("");
    const [needsApproval, setNeedsApproval] = useState(true);

    const { address, isConnected, chain } = useAccount();

    // Get MNT token balance (ERC20)
    const { data: mntBalance, refetch: refetchMntBalance } = useReadContract({
        address: MNT_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_ID,
    });

    // Get TOWN balance (on Mantle Sepolia)
    const { data: townBalance, refetch: refetchTownBalance } = useReadContract({
        address: TOWN_TOKEN_MANTLE_ADDRESS as `0x${string}`,
        abi: TownTokenABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_ID,
    });

    // Get current allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: MNT_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: address ? [address, TOWN_TOPUP_MANTLE_ADDRESS as `0x${string}`] : undefined,
        chainId: CHAIN_ID,
    });

    // Get conversion rate
    const { data: rate } = useReadContract({
        address: TOWN_TOPUP_MANTLE_ADDRESS as `0x${string}`,
        abi: TownTopUpABI,
        functionName: "RATE",
        chainId: CHAIN_ID,
    });

    // Check if approval is needed
    useEffect(() => {
        if (allowance && mntAmount) {
            const requiredAmount = parseEther(mntAmount);
            setNeedsApproval((allowance as bigint) < requiredAmount);
        }
    }, [allowance, mntAmount]);

    // Write contract functions
    const { writeContract, isPending } = useWriteContract();

    const handleApprove = async () => {
        try {
            setStatus("Approving MNT...");
            writeContract({
                address: MNT_TOKEN_ADDRESS as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [TOWN_TOPUP_MANTLE_ADDRESS as `0x${string}`, parseEther("1000000")], // Approve large amount
                chainId: CHAIN_ID,
            }, {
                onSuccess: () => {
                    setStatus("✅ Approval successful! Now you can buy TOWN.");
                    refetchAllowance();
                    setNeedsApproval(false);
                },
                onError: (error) => {
                    setStatus(`Error: ${error.message}`);
                },
            });
        } catch (error: any) {
            setStatus(`Error: ${error.message}`);
        }
    };

    const handleBuyTown = async () => {
        if (!mntAmount || parseFloat(mntAmount) <= 0) {
            setStatus("Please enter a valid amount");
            return;
        }

        try {
            setStatus("Buying TOWN...");
            writeContract({
                address: TOWN_TOPUP_MANTLE_ADDRESS as `0x${string}`,
                abi: TownTopUpABI,
                functionName: "buyTOWN",
                args: [parseEther(mntAmount)],
                chainId: CHAIN_ID,
            }, {
                onSuccess: () => {
                    setStatus(`✅ Success! You bought ${parseFloat(mntAmount) * 50} TOWN`);
                    refetchTownBalance();
                    refetchMntBalance();
                },
                onError: (error) => {
                    setStatus(`Error: ${error.message}`);
                },
            });
        } catch (error: any) {
            setStatus(`Error: ${error.message}`);
        }
    };

    const expectedTown = parseFloat(mntAmount || "0") * 50;

    // Check if on wrong network
    const isWrongNetwork = isConnected && chain?.id !== CHAIN_ID;
    const hasMntBalance = mntBalance && (mntBalance as bigint) > 0n;

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            padding: "40px 20px",
            fontFamily: "system-ui, sans-serif",
        }}>
            <div style={{
                maxWidth: "500px",
                margin: "0 auto",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "20px",
                padding: "30px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
            }}>
                <h1 style={{
                    color: "#fff",
                    fontSize: "24px",
                    marginBottom: "10px",
                    textAlign: "center",
                }}>
                    🏘️ TownTopUp (Mantle Sepolia)
                </h1>
                <p style={{
                    color: "#10b981",
                    textAlign: "center",
                    marginBottom: "10px",
                    fontSize: "14px",
                }}>
                    Convert MNT → TOWN
                </p>
                <p style={{
                    color: "#888",
                    textAlign: "center",
                    marginBottom: "30px",
                }}>
                    1 MNT = 50 TOWN
                </p>

                {/* Connect Wallet */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "30px" }}>
                    <ConnectButton />
                </div>

                {/* Wrong Network Warning */}
                {isWrongNetwork && (
                    <div style={{
                        background: "rgba(251, 191, 36, 0.2)",
                        borderRadius: "12px",
                        padding: "15px",
                        marginBottom: "20px",
                        border: "1px solid rgba(251, 191, 36, 0.3)",
                    }}>
                        <p style={{ color: "#fbbf24", fontSize: "14px", margin: 0 }}>
                            ⚠️ Please switch to Mantle Sepolia Testnet (Chain ID: 5003)
                        </p>
                    </div>
                )}

                {isConnected && !isWrongNetwork && (
                    <>
                        {/* Balances */}
                        <div style={{
                            background: "rgba(0, 0, 0, 0.3)",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "20px",
                        }}>
                            <h3 style={{ color: "#10b981", marginBottom: "15px", fontSize: "14px" }}>Your Balances</h3>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                <span style={{ color: "#888" }}>MNT:</span>
                                <span style={{ color: "#10b981", fontWeight: "bold" }}>
                                    {mntBalance ? parseFloat(formatEther(mntBalance as bigint)).toFixed(4) : "0"} MNT
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#888" }}>TOWN:</span>
                                <span style={{ color: "#fff", fontWeight: "bold" }}>
                                    {townBalance ? parseFloat(formatEther(townBalance as bigint)).toFixed(2) : "0"} TOWN
                                </span>
                            </div>
                        </div>

                        {/* Zero Balance Warning */}
                        {!hasMntBalance && (
                            <div style={{
                                background: "rgba(59, 130, 246, 0.2)",
                                borderRadius: "12px",
                                padding: "15px",
                                marginBottom: "20px",
                                border: "1px solid rgba(59, 130, 246, 0.3)",
                            }}>
                                <p style={{ color: "#3b82f6", fontSize: "14px", margin: "0 0 10px 0" }}>
                                    💧 You need MNT tokens to buy TOWN!
                                </p>
                                <a
                                    href="https://faucet.testnet.mantle.xyz/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: "#60a5fa",
                                        fontSize: "13px",
                                        textDecoration: "underline",
                                    }}
                                >
                                    Get MNT from Mantle Faucet →
                                </a>
                            </div>
                        )}

                        {/* Conversion Rate */}
                        <div style={{
                            background: "rgba(16, 185, 129, 0.1)",
                            borderRadius: "12px",
                            padding: "15px",
                            marginBottom: "20px",
                            textAlign: "center",
                        }}>
                            <span style={{ color: "#10b981", fontSize: "14px" }}>
                                Rate: 1 MNT = {rate ? rate.toString() : "50"} TOWN
                            </span>
                        </div>

                        {/* Input */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ color: "#888", fontSize: "14px", display: "block", marginBottom: "8px" }}>
                                Amount (MNT)
                            </label>
                            <input
                                type="number"
                                value={mntAmount}
                                onChange={(e) => setMntAmount(e.target.value)}
                                placeholder="0.1"
                                step="0.01"
                                min="0"
                                style={{
                                    width: "100%",
                                    padding: "15px",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    background: "rgba(0, 0, 0, 0.3)",
                                    color: "#fff",
                                    fontSize: "18px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                            <p style={{ color: "#888", fontSize: "12px", marginTop: "8px" }}>
                                You will receive: <span style={{ color: "#10b981", fontWeight: "bold" }}>{expectedTown} TOWN</span>
                            </p>
                        </div>

                        {/* Approve Button (if needed) */}
                        {needsApproval && (
                            <button
                                onClick={handleApprove}
                                disabled={isPending}
                                style={{
                                    width: "100%",
                                    padding: "15px",
                                    borderRadius: "12px",
                                    border: "none",
                                    background: isPending
                                        ? "rgba(251, 191, 36, 0.5)"
                                        : "linear-gradient(135deg, #f59e0b, #d97706)",
                                    color: "#fff",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    cursor: isPending ? "not-allowed" : "pointer",
                                    transition: "all 0.2s",
                                    marginBottom: "10px",
                                }}
                            >
                                {isPending ? "Approving..." : "1. Approve MNT"}
                            </button>
                        )}

                        {/* Buy Button */}
                        <button
                            onClick={handleBuyTown}
                            disabled={isPending || needsApproval}
                            style={{
                                width: "100%",
                                padding: "15px",
                                borderRadius: "12px",
                                border: "none",
                                background: (isPending || needsApproval)
                                    ? "rgba(16, 185, 129, 0.3)"
                                    : "linear-gradient(135deg, #10b981, #059669)",
                                color: "#fff",
                                fontSize: "16px",
                                fontWeight: "bold",
                                cursor: (isPending || needsApproval) ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                            }}
                        >
                            {isPending ? "Processing..." : needsApproval ? "2. Buy TOWN (Approve first)" : `Buy ${expectedTown} TOWN`}
                        </button>

                        {/* Status */}
                        {status && (
                            <div style={{
                                marginTop: "20px",
                                padding: "15px",
                                borderRadius: "12px",
                                background: status.includes("Error")
                                    ? "rgba(239, 68, 68, 0.2)"
                                    : status.includes("✅")
                                        ? "rgba(34, 197, 94, 0.2)"
                                        : "rgba(16, 185, 129, 0.2)",
                                color: status.includes("Error")
                                    ? "#ef4444"
                                    : status.includes("✅")
                                        ? "#22c55e"
                                        : "#10b981",
                                fontSize: "14px",
                                textAlign: "center",
                            }}>
                                {status}
                            </div>
                        )}

                        {/* Contract Info */}
                        <div style={{
                            marginTop: "30px",
                            padding: "15px",
                            background: "rgba(0, 0, 0, 0.2)",
                            borderRadius: "12px",
                            fontSize: "11px",
                            color: "#666",
                        }}>
                            <p style={{ marginBottom: "5px" }}>TownTopUp: {TOWN_TOPUP_MANTLE_ADDRESS}</p>
                            <p style={{ marginBottom: "5px" }}>TownToken: {TOWN_TOKEN_MANTLE_ADDRESS}</p>
                            <p>MNT Token: {MNT_TOKEN_ADDRESS}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
