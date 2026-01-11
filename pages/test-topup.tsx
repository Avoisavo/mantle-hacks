import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useBalance } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TOWN_TOPUP_ADDRESS, TOWN_TOKEN_ADDRESS, SEPOLIA_MNT_TOKEN_ADDRESS } from "@/utils/address";
import { ABI as TownTopUpABI } from "@/utils/towntopup";
import { ABI as TownTokenABI } from "@/utils/towntoken";
import { mantleSepoliaTestnet, sepolia } from "wagmi/chains";

// Chain IDs
const MANTLE_SEPOLIA_CHAIN_ID = mantleSepoliaTestnet.id; // 5003
const ETH_SEPOLIA_CHAIN_ID = sepolia.id; // 11155111 (for SepoliaMNT token)

export default function TestTopUp() {
    const [mntAmount, setMntAmount] = useState("0.1");
    const [status, setStatus] = useState("");

    const { address, isConnected, chainId } = useAccount();

    // Get native MNT balance on Mantle Sepolia
    const { data: mntBalance, refetch: refetchMntBalance } = useBalance({
        address: address,
        chainId: MANTLE_SEPOLIA_CHAIN_ID,
    });

    // Get SepoliaMNT token balance (ERC20 on Ethereum Sepolia)
    const { data: sepoliaMntBalance } = useReadContract({
        address: SEPOLIA_MNT_TOKEN_ADDRESS as `0x${string}`,
        abi: TownTokenABI, // ERC20 ABI - balanceOf is standard
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: ETH_SEPOLIA_CHAIN_ID,
    });

    // Get TOWN balance
    const { data: townBalance, refetch: refetchTownBalance } = useReadContract({
        address: TOWN_TOKEN_ADDRESS as `0x${string}`,
        abi: TownTokenABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: MANTLE_SEPOLIA_CHAIN_ID,
    });

    // Get conversion rate
    const { data: rate } = useReadContract({
        address: TOWN_TOPUP_ADDRESS as `0x${string}`,
        abi: TownTopUpABI,
        functionName: "RATE",
        chainId: MANTLE_SEPOLIA_CHAIN_ID,
    });

    // Buy TOWN function
    const { writeContract, isPending } = useWriteContract();

    const handleBuyTown = async () => {
        if (!mntAmount || parseFloat(mntAmount) <= 0) {
            setStatus("Please enter a valid amount");
            return;
        }

        try {
            setStatus("Sending transaction...");
            writeContract({
                address: TOWN_TOPUP_ADDRESS as `0x${string}`,
                abi: TownTopUpABI,
                functionName: "buyTOWN",
                value: parseEther(mntAmount),
            }, {
                onSuccess: () => {
                    setStatus(`Success! You bought ${parseFloat(mntAmount) * 50} TOWN`);
                    refetchTownBalance();
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
                    🏘️ TownTopUp Test
                </h1>
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

                {isConnected && (
                    <>
                        {/* Balances */}
                        <div style={{
                            background: "rgba(0, 0, 0, 0.3)",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "20px",
                        }}>
                            <h3 style={{ color: "#ec4899", marginBottom: "15px", fontSize: "14px" }}>Your Balances</h3>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                <span style={{ color: "#888" }}>MNT (Mantle Sepolia):</span>
                                <span style={{ color: "#fff", fontWeight: "bold" }}>
                                    {mntBalance ? parseFloat(formatEther(mntBalance.value)).toFixed(4) : "0"} MNT
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                <span style={{ color: "#888" }}>SepoliaMNT (Eth Sepolia):</span>
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
                            background: "rgba(236, 72, 153, 0.1)",
                            borderRadius: "12px",
                            padding: "15px",
                            marginBottom: "20px",
                            textAlign: "center",
                        }}>
                            <span style={{ color: "#ec4899", fontSize: "14px" }}>
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
                                You will receive: <span style={{ color: "#ec4899", fontWeight: "bold" }}>{expectedTown} TOWN</span>
                            </p>
                        </div>

                        {/* Buy Button */}
                        <button
                            onClick={handleBuyTown}
                            disabled={isPending}
                            style={{
                                width: "100%",
                                padding: "15px",
                                borderRadius: "12px",
                                border: "none",
                                background: isPending
                                    ? "rgba(236, 72, 153, 0.5)"
                                    : "linear-gradient(135deg, #ec4899, #8b5cf6)",
                                color: "#fff",
                                fontSize: "16px",
                                fontWeight: "bold",
                                cursor: isPending ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                            }}
                        >
                            {isPending ? "Processing..." : `Buy ${expectedTown} TOWN`}
                        </button>

                        {/* Status */}
                        {status && (
                            <div style={{
                                marginTop: "20px",
                                padding: "15px",
                                borderRadius: "12px",
                                background: status.includes("Error")
                                    ? "rgba(239, 68, 68, 0.2)"
                                    : status.includes("Success")
                                        ? "rgba(34, 197, 94, 0.2)"
                                        : "rgba(236, 72, 153, 0.2)",
                                color: status.includes("Error")
                                    ? "#ef4444"
                                    : status.includes("Success")
                                        ? "#22c55e"
                                        : "#ec4899",
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
                            <p style={{ marginBottom: "5px" }}>TownTopUp: {TOWN_TOPUP_ADDRESS}</p>
                            <p>TownToken: {TOWN_TOKEN_ADDRESS}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
