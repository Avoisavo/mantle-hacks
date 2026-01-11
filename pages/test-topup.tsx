import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
    SEPOLIA_MNT_TOKEN_ADDRESS,
    TOWN_TOPUP_ERC20_ADDRESS,
    TOWN_TOKEN_SEPOLIA_ADDRESS
} from "@/utils/address";
import { ABI as TownTopUpERC20ABI, ERC20_ABI } from "@/utils/towntopupERC20";
import { ABI as TownTokenABI } from "@/utils/towntoken";
import { sepolia } from "wagmi/chains";

// Ethereum Sepolia Chain ID
const CHAIN_ID = sepolia.id; // 11155111

export default function TestTopUpSepolia() {
    const [mntAmount, setMntAmount] = useState("0.1");
    const [status, setStatus] = useState("");
    const [needsApproval, setNeedsApproval] = useState(true);

    const { address, isConnected } = useAccount();

    // Get SepoliaMNT balance
    const { data: sepoliaMntBalance, refetch: refetchMntBalance } = useReadContract({
        address: SEPOLIA_MNT_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_ID,
    });

    // Get TOWN balance (on Sepolia)
    const { data: townBalance, refetch: refetchTownBalance } = useReadContract({
        address: TOWN_TOKEN_SEPOLIA_ADDRESS as `0x${string}`,
        abi: TownTokenABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_ID,
    });

    // Get current allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: SEPOLIA_MNT_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: address ? [address, TOWN_TOPUP_ERC20_ADDRESS as `0x${string}`] : undefined,
        chainId: CHAIN_ID,
    });

    // Get conversion rate
    const { data: rate } = useReadContract({
        address: TOWN_TOPUP_ERC20_ADDRESS as `0x${string}`,
        abi: TownTopUpERC20ABI,
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
            setStatus("Approving SepoliaMNT...");
            writeContract({
                address: SEPOLIA_MNT_TOKEN_ADDRESS as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [TOWN_TOPUP_ERC20_ADDRESS as `0x${string}`, parseEther("1000000")], // Approve large amount
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
                address: TOWN_TOPUP_ERC20_ADDRESS as `0x${string}`,
                abi: TownTopUpERC20ABI,
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
                    🏘️ TownTopUp (Ethereum Sepolia)
                </h1>
                <p style={{
                    color: "#10b981",
                    textAlign: "center",
                    marginBottom: "10px",
                    fontSize: "14px",
                }}>
                    Convert SepoliaMNT → TOWN
                </p>
                <p style={{
                    color: "#888",
                    textAlign: "center",
                    marginBottom: "30px",
                }}>
                    1 SepoliaMNT = 50 TOWN
                </p>

                {/* Connect Wallet */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "30px" }}>
                    <ConnectButton />
                </div>

                {isConnected && (
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
                                <span style={{ color: "#888" }}>SepoliaMNT:</span>
                                <span style={{ color: "#10b981", fontWeight: "bold" }}>
                                    {sepoliaMntBalance ? parseFloat(formatEther(sepoliaMntBalance as bigint)).toFixed(4) : "0"} MNT
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#888" }}>TOWN:</span>
                                <span style={{ color: "#fff", fontWeight: "bold" }}>
                                    {townBalance ? parseFloat(formatEther(townBalance as bigint)).toFixed(2) : "0"} TOWN
                                </span>
                            </div>
                        </div>

                        {/* Conversion Rate */}
                        <div style={{
                            background: "rgba(16, 185, 129, 0.1)",
                            borderRadius: "12px",
                            padding: "15px",
                            marginBottom: "20px",
                            textAlign: "center",
                        }}>
                            <span style={{ color: "#10b981", fontSize: "14px" }}>
                                Rate: 1 SepoliaMNT = {rate ? rate.toString() : "50"} TOWN
                            </span>
                        </div>

                        {/* Input */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ color: "#888", fontSize: "14px", display: "block", marginBottom: "8px" }}>
                                Amount (SepoliaMNT)
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
                                {isPending ? "Approving..." : "1. Approve SepoliaMNT"}
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
                            <p style={{ marginBottom: "5px" }}>TownTopUpERC20: {TOWN_TOPUP_ERC20_ADDRESS}</p>
                            <p style={{ marginBottom: "5px" }}>TownToken: {TOWN_TOKEN_SEPOLIA_ADDRESS}</p>
                            <p>SepoliaMNT: {SEPOLIA_MNT_TOKEN_ADDRESS}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
