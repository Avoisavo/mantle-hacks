import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useBalance } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
    TOWN_TOPUP_NATIVE_ADDRESS,
    TOWN_TOKEN_NATIVE_ADDRESS,
    TOWN_TOPUP_MANTLE_ADDRESS,
    TOWN_TOKEN_MANTLE_ADDRESS,
    MNT_TOKEN_ADDRESS,
    MY_NFT_ADDRESS
} from "@/utils/address";
import { ABI as TownTopUpNativeABI } from "@/utils/towntopnative";
import { ABI as TownTokenABI } from "@/utils/towntoken";
import { ABI as MyNFTABI } from "@/utils/mynft";
import { mantleSepoliaTestnet } from "wagmi/chains";

// Mantle Sepolia Chain ID
const CHAIN_ID = mantleSepoliaTestnet.id; // 5003

export default function TestTopUpMantle() {
    const [mntAmount, setMntAmount] = useState("0.1");
    const [status, setStatus] = useState("");
    const [selectedUser, setSelectedUser] = useState<number | null>(null);
    const [mintStatus, setMintStatus] = useState<{ type: 'success' | 'error' | 'loading' | '', message: string, txHash?: string }>({ type: '', message: '' });

    const { address, isConnected, chain } = useAccount();

    // Get native MNT balance
    const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
        address: address,
        chainId: CHAIN_ID,
    });

    // Get TOWN balance
    const { data: townBalance, refetch: refetchTownBalance } = useReadContract({
        address: TOWN_TOKEN_NATIVE_ADDRESS as `0x${string}`,
        abi: TownTokenABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_ID,
    });

    // Get conversion rate
    const { data: rate } = useReadContract({
        address: TOWN_TOPUP_NATIVE_ADDRESS as `0x${string}`,
        abi: TownTopUpNativeABI,
        functionName: "RATE",
        chainId: CHAIN_ID,
    });

    // Write contract functions
    const { writeContract, isPending } = useWriteContract();

    const handleBuyTown = async () => {
        if (!mntAmount || parseFloat(mntAmount) <= 0) {
            setStatus("❌ Error: Please enter a valid amount");
            return;
        }

        // Check if user has enough native MNT
        const requiredAmount = parseEther(mntAmount);
        const currentBalance = nativeBalance?.value || 0n;

        if (currentBalance < requiredAmount) {
            setStatus(`❌ Error: Insufficient MNT balance. You need ${mntAmount} MNT but only have ${formatEther(currentBalance)}`);
            return;
        }

        try {
            setStatus("Buying TOWN with native MNT...");
            writeContract({
                address: TOWN_TOPUP_NATIVE_ADDRESS as `0x${string}`,
                abi: TownTopUpNativeABI,
                functionName: "buyTOWN",
                value: parseEther(mntAmount), // Send MNT with transaction
                chainId: CHAIN_ID,
            }, {
                onSuccess: () => {
                    setStatus(`✅ Success! You bought ${parseFloat(mntAmount) * 50} TOWN`);
                    refetchTownBalance();
                    refetchNativeBalance();
                },
                onError: (error) => {
                    console.error("Buy TOWN error:", error);
                    setStatus(`❌ Error: ${error.message}`);
                },
            });
        } catch (error: any) {
            console.error("Buy TOWN catch error:", error);
            setStatus(`❌ Error: ${error.message}`);
        }
    };

    const handleMintNFT = async () => {
        if (!address) {
            setMintStatus({ type: 'error', message: 'Please connect your wallet first' });
            alert('❌ Please connect your wallet first');
            return;
        }

        try {
            setMintStatus({ type: 'loading', message: 'Minting your NFT...' });

            // Create a simple token URI - you can customize this
            const tokenURI = `https://example.com/nft/${address}`;

            writeContract({
                address: MY_NFT_ADDRESS as `0x${string}`,
                abi: MyNFTABI,
                functionName: "mint",
                args: [address, tokenURI],
                chainId: CHAIN_ID,
            }, {
                onSuccess: (hash) => {
                    const explorerUrl = `https://sepolia.mantlescan.xyz/tx/${hash}`;
                    setMintStatus({
                        type: 'success',
                        message: 'NFT Minted Successfully!',
                        txHash: hash
                    });
                    setStatus(`✅ NFT Minted Successfully! View on Explorer: ${explorerUrl}`);

                    // Show alert
                    alert(`🎉 NFT Minted Successfully!\n\nTransaction Hash: ${hash}\n\nView on Explorer:\n${explorerUrl}`);

                    // Show browser notification if available
                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                        new Notification('NFT Minted Successfully! 🎉', {
                            body: `Transaction: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
                            icon: '/favicon.ico'
                        });
                    }
                },
                onError: (error) => {
                    console.error("Mint NFT error:", error);
                    const errorMessage = error.message || "Unknown error occurred";
                    setMintStatus({ type: 'error', message: errorMessage });
                    setStatus(`❌ Minting Failed: ${errorMessage}`);

                    // Show alert
                    alert(`❌ NFT Minting Failed\n\n${errorMessage}`);

                    // Show browser notification for error if available
                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                        new Notification('NFT Minting Failed ❌', {
                            body: errorMessage.slice(0, 100),
                            icon: '/favicon.ico'
                        });
                    }
                },
            });
        } catch (error: any) {
            console.error("Mint NFT catch error:", error);
            const errorMessage = error.message || "Unknown error occurred";
            setMintStatus({ type: 'error', message: errorMessage });
            setStatus(`❌ Error: ${errorMessage}`);
            alert(`❌ Error: ${errorMessage}`);
        }
    };

    // User profiles with real-world assets
    const users = [
        {
            id: 1,
            name: "Emma Richardson",
            avatar: "👩🏼‍💼",
            netWorth: "$2.4M",
            assets: [
                { type: "Real Estate", items: ["Manhattan Condo ($1.2M)", "Hamptons Beach House ($800K)"] },
                { type: "Vehicles", items: ["Tesla Model S ($95K)", "Range Rover ($120K)"] },
                { type: "Investments", items: ["Stock Portfolio ($150K)", "Cryptocurrency ($45K)"] },
                { type: "Cash & Savings", items: ["$90K"] }
            ]
        },
        {
            id: 2,
            name: "Marcus Chen",
            avatar: "👨🏻‍💻",
            netWorth: "$850K",
            assets: [
                { type: "Real Estate", items: ["San Francisco Apartment ($650K)"] },
                { type: "Vehicles", items: ["BMW 3 Series ($55K)"] },
                { type: "Investments", items: ["401(k) ($85K)", "ETF Portfolio ($40K)"] },
                { type: "Cash & Savings", items: ["$20K"] }
            ]
        },
        {
            id: 3,
            name: "Sarah Johnson",
            avatar: "👩🏽‍🏫",
            netWorth: "$180K",
            assets: [
                { type: "Real Estate", items: ["Renting (No property owned)"] },
                { type: "Vehicles", items: ["Honda Civic ($22K)"] },
                { type: "Investments", items: ["Savings Account ($15K)", "Retirement Fund ($8K)"] },
                { type: "Cash & Savings", items: ["$5K"] }
            ]
        },
        {
            id: 4,
            name: "David Martinez",
            avatar: "👨🏾‍🔧",
            netWorth: "$45K",
            assets: [
                { type: "Real Estate", items: ["Renting (No property owned)"] },
                { type: "Vehicles", items: ["2010 Ford F-150 ($8K)"] },
                { type: "Investments", items: ["None"] },
                { type: "Cash & Savings", items: ["$2K"] }
            ]
        }
    ];

    const expectedTown = parseFloat(mntAmount || "0") * 50;

    // Check if on wrong network
    const isWrongNetwork = isConnected && chain?.id !== CHAIN_ID;
    const hasEnoughMnt = nativeBalance && nativeBalance.value >= parseEther(mntAmount || "0");

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            padding: "40px 20px",
            fontFamily: "system-ui, sans-serif",
        }}>
            <div style={{
                maxWidth: "1200px",
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "30px",
            }}>
                {/* Top Up Panel */}
                <div style={{
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

                                {/* Native MNT */}
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                    <span style={{ color: "#10b981", fontSize: "14px", fontWeight: "500" }}>MNT:</span>
                                    <span style={{ color: "#10b981", fontWeight: "bold" }}>
                                        {nativeBalance ? parseFloat(formatEther(nativeBalance.value)).toFixed(4) : "0"} MNT
                                    </span>
                                </div>

                                {/* TOWN Balance */}
                                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                                    <span style={{ color: "#888" }}>TOWN:</span>
                                    <span style={{ color: "#fff", fontWeight: "bold" }}>
                                        {townBalance ? parseFloat(formatEther(townBalance as bigint)).toFixed(2) : "0"} TOWN
                                    </span>
                                </div>
                            </div>

                            {/* Low Balance Warning */}
                            {nativeBalance && nativeBalance.value < parseEther("0.01") && (
                                <div style={{
                                    background: "rgba(251, 191, 36, 0.2)",
                                    borderRadius: "12px",
                                    padding: "15px",
                                    marginBottom: "20px",
                                    border: "1px solid rgba(251, 191, 36, 0.3)",
                                }}>
                                    <p style={{ color: "#fbbf24", fontSize: "14px", margin: "0 0 8px 0", fontWeight: "500" }}>
                                        ⚠️ Low MNT Balance
                                    </p>
                                    <p style={{ color: "#fcd34d", fontSize: "12px", margin: "0 0 10px 0" }}>
                                        You need MNT tokens to buy TOWN and pay for gas.
                                    </p>
                                    <a
                                        href="https://faucet.testnet.mantle.xyz/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: "#fcd34d",
                                            fontSize: "13px",
                                            textDecoration: "underline",
                                        }}
                                    >
                                        → Get MNT from Mantle Faucet
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

                            {/* Buy Button */}
                            <button
                                onClick={handleBuyTown}
                                disabled={isPending || !hasEnoughMnt}
                                style={{
                                    width: "100%",
                                    padding: "15px",
                                    borderRadius: "12px",
                                    border: "none",
                                    background: (isPending || !hasEnoughMnt)
                                        ? "rgba(16, 185, 129, 0.3)"
                                        : "linear-gradient(135deg, #10b981, #059669)",
                                    color: "#fff",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    cursor: (isPending || !hasEnoughMnt) ? "not-allowed" : "pointer",
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
                                    background: status.includes("Error") || status.includes("Failed")
                                        ? "rgba(239, 68, 68, 0.2)"
                                        : status.includes("✅")
                                            ? "rgba(34, 197, 94, 0.2)"
                                            : "rgba(16, 185, 129, 0.2)",
                                    color: status.includes("Error") || status.includes("Failed")
                                        ? "#ef4444"
                                        : status.includes("✅")
                                            ? "#22c55e"
                                            : "#10b981",
                                    fontSize: "14px",
                                    textAlign: "center",
                                }}>
                                    {/* Parse and render explorer links */}
                                    {status.includes("https://") ? (
                                        <>
                                            {status.split("https://")[0]}
                                            <a
                                                href={`https://${status.split("https://")[1]}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: "#10b981",
                                                    textDecoration: "underline",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                View Transaction
                                            </a>
                                        </>
                                    ) : (
                                        status
                                    )}
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
                {/* End of Top Up Panel */}

                {/* Property Listings Panel */}
                <div style={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
                    borderRadius: "20px",
                    padding: "30px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                }}>
                    <h2 style={{
                        color: "#10b981",
                        fontSize: "24px",
                        fontWeight: "bold",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}>
                        🏘️ Property Listings
                    </h2>
                    <p style={{
                        color: "#888",
                        fontSize: "14px",
                        marginBottom: "25px",
                    }}>
                        Choose your dream property
                    </p>

                    {/* Show user icons only when connected to Mantle Sepolia (5003) */}
                    {isConnected && chain?.id === CHAIN_ID ? (
                        <>
                            {/* User Profile Icons */}
                            <div style={{
                                display: "flex",
                                gap: "15px",
                                marginBottom: "25px",
                                justifyContent: "center",
                            }}>
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => setSelectedUser(user.id)}
                                        style={{
                                            width: "60px",
                                            height: "60px",
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "32px",
                                            cursor: "pointer",
                                            border: "3px solid rgba(16, 185, 129, 0.3)",
                                            transition: "all 0.2s",
                                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "scale(1.1)";
                                            e.currentTarget.style.borderColor = "#10b981";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "scale(1)";
                                            e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
                                        }}
                                    >
                                        {user.avatar}
                                    </div>
                                ))}
                            </div>

                            {/* Asset Modal */}
                            {selectedUser !== null && (
                                <div
                                    style={{
                                        position: "fixed",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: "rgba(0, 0, 0, 0.8)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 1000,
                                    }}
                                    onClick={() => setSelectedUser(null)}
                                >
                                    <div
                                        style={{
                                            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                                            borderRadius: "20px",
                                            padding: "30px",
                                            maxWidth: "500px",
                                            width: "90%",
                                            border: "2px solid #10b981",
                                            boxShadow: "0 0 40px rgba(16, 185, 129, 0.3)",
                                            maxHeight: "80vh",
                                            overflowY: "auto",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {users.find(u => u.id === selectedUser) && (() => {
                                            const user = users.find(u => u.id === selectedUser)!;
                                            return (
                                                <>
                                                    {/* Header */}
                                                    <div style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        marginBottom: "20px",
                                                        paddingBottom: "20px",
                                                        borderBottom: "2px solid rgba(16, 185, 129, 0.3)",
                                                    }}>
                                                        <div style={{
                                                            width: "70px",
                                                            height: "70px",
                                                            borderRadius: "50%",
                                                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "40px",
                                                            marginRight: "15px",
                                                        }}>
                                                            {user.avatar}
                                                        </div>
                                                        <div>
                                                            <h2 style={{
                                                                color: "#fff",
                                                                fontSize: "24px",
                                                                margin: "0 0 5px 0",
                                                            }}>
                                                                {user.name}
                                                            </h2>
                                                            <p style={{
                                                                color: "#10b981",
                                                                fontSize: "18px",
                                                                fontWeight: "bold",
                                                                margin: 0,
                                                            }}>
                                                                Net Worth: {user.netWorth}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Assets */}
                                                    <h3 style={{
                                                        color: "#10b981",
                                                        fontSize: "18px",
                                                        marginBottom: "15px",
                                                    }}>
                                                        {user.id === 1 ? "Digital Asset Portfolio (NFTs)" : "Real-World Assets"}
                                                    </h3>

                                                    {user.id === 1 ? (
                                                        /* NFT Cards for Emma Richardson */
                                                        <div style={{
                                                            display: "grid",
                                                            gridTemplateColumns: "1fr 1fr",
                                                            gap: "20px",
                                                            marginBottom: "15px",
                                                        }}>
                                                            {/* NFT Card 1 - Manhattan Condo */}
                                                            <div style={{
                                                                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                                                                borderRadius: "16px",
                                                                padding: "3px",
                                                                boxShadow: "0 0 30px rgba(147, 112, 219, 0.6), inset 0 0 20px rgba(147, 112, 219, 0.2)",
                                                                border: "2px solid rgba(147, 112, 219, 0.8)",
                                                                position: "relative",
                                                            }}>
                                                                <div style={{
                                                                    background: "linear-gradient(135deg, #2a2a3e 0%, #1e2a3e 100%)",
                                                                    borderRadius: "14px",
                                                                    padding: "12px",
                                                                }}>
                                                                    {/* Image Area */}
                                                                    <div style={{
                                                                        width: "100%",
                                                                        height: "120px",
                                                                        background: "linear-gradient(135deg, #4a5568 20%, #2d3748 80%)",
                                                                        borderRadius: "10px",
                                                                        marginBottom: "12px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        fontSize: "50px",
                                                                        border: "1px solid rgba(147, 112, 219, 0.3)",
                                                                    }}>
                                                                        🏢
                                                                    </div>
                                                                    {/* Title */}
                                                                    <div style={{
                                                                        textAlign: "center",
                                                                        borderBottom: "1px solid rgba(147, 112, 219, 0.3)",
                                                                        paddingBottom: "8px",
                                                                        marginBottom: "8px",
                                                                    }}>
                                                                        <h4 style={{
                                                                            color: "#e0e0e0",
                                                                            fontSize: "11px",
                                                                            fontWeight: "600",
                                                                            margin: 0,
                                                                            letterSpacing: "2px",
                                                                            textTransform: "uppercase",
                                                                        }}>
                                                                            — SCARSDALE, NEW YORK —
                                                                        </h4>
                                                                    </div>
                                                                    {/* Description */}
                                                                    <div style={{ marginBottom: "8px" }}>
                                                                        <p style={{
                                                                            color: "#fff",
                                                                            fontSize: "13px",
                                                                            fontWeight: "bold",
                                                                            margin: "0 0 4px 0",
                                                                        }}>
                                                                            Manhattan Condo
                                                                        </p>
                                                                        <p style={{
                                                                            color: "#999",
                                                                            fontSize: "10px",
                                                                            margin: 0,
                                                                            lineHeight: "1.3",
                                                                        }}>
                                                                            Luxury penthouse in the heart of NYC. Premium real estate asset.
                                                                        </p>
                                                                    </div>
                                                                    {/* Footer with value and QR */}
                                                                    <div style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "flex-end",
                                                                    }}>
                                                                        <div style={{
                                                                            color: "#9370db",
                                                                            fontSize: "12px",
                                                                            fontWeight: "bold",
                                                                        }}>
                                                                            $1.2M
                                                                        </div>
                                                                        <div style={{
                                                                            width: "25px",
                                                                            height: "25px",
                                                                            background: "#fff",
                                                                            borderRadius: "4px",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            fontSize: "8px",
                                                                        }}>
                                                                            QR
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* NFT Card 2 - Hamptons Beach House */}
                                                            <div style={{
                                                                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                                                                borderRadius: "16px",
                                                                padding: "3px",
                                                                boxShadow: "0 0 30px rgba(100, 200, 255, 0.6), inset 0 0 20px rgba(100, 200, 255, 0.2)",
                                                                border: "2px solid rgba(100, 200, 255, 0.8)",
                                                                position: "relative",
                                                            }}>
                                                                <div style={{
                                                                    background: "linear-gradient(135deg, #2a2a3e 0%, #1e2a3e 100%)",
                                                                    borderRadius: "14px",
                                                                    padding: "12px",
                                                                }}>
                                                                    <div style={{
                                                                        width: "100%",
                                                                        height: "120px",
                                                                        background: "linear-gradient(135deg, #4a5568 20%, #2d3748 80%)",
                                                                        borderRadius: "10px",
                                                                        marginBottom: "12px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        fontSize: "50px",
                                                                        border: "1px solid rgba(100, 200, 255, 0.3)",
                                                                    }}>
                                                                        🏖️
                                                                    </div>
                                                                    <div style={{
                                                                        textAlign: "center",
                                                                        borderBottom: "1px solid rgba(100, 200, 255, 0.3)",
                                                                        paddingBottom: "8px",
                                                                        marginBottom: "8px",
                                                                    }}>
                                                                        <h4 style={{
                                                                            color: "#e0e0e0",
                                                                            fontSize: "11px",
                                                                            fontWeight: "600",
                                                                            margin: 0,
                                                                            letterSpacing: "2px",
                                                                            textTransform: "uppercase",
                                                                        }}>
                                                                            — LOS ALTOS, CALIFORNIA —
                                                                        </h4>
                                                                    </div>
                                                                    <div style={{ marginBottom: "8px" }}>
                                                                        <p style={{
                                                                            color: "#fff",
                                                                            fontSize: "13px",
                                                                            fontWeight: "bold",
                                                                            margin: "0 0 4px 0",
                                                                        }}>
                                                                            Hamptons Beach House
                                                                        </p>
                                                                        <p style={{
                                                                            color: "#999",
                                                                            fontSize: "10px",
                                                                            margin: 0,
                                                                            lineHeight: "1.3",
                                                                        }}>
                                                                            Beachfront property with ocean views. Exclusive vacation home.
                                                                        </p>
                                                                    </div>
                                                                    <div style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "flex-end",
                                                                    }}>
                                                                        <div style={{
                                                                            color: "#64c8ff",
                                                                            fontSize: "12px",
                                                                            fontWeight: "bold",
                                                                        }}>
                                                                            $800K
                                                                        </div>
                                                                        <div style={{
                                                                            width: "25px",
                                                                            height: "25px",
                                                                            background: "#fff",
                                                                            borderRadius: "4px",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            fontSize: "8px",
                                                                        }}>
                                                                            QR
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* NFT Card 3 - Luxury Vehicles */}
                                                            <div style={{
                                                                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                                                                borderRadius: "16px",
                                                                padding: "3px",
                                                                boxShadow: "0 0 30px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.2)",
                                                                border: "2px solid rgba(16, 185, 129, 0.8)",
                                                                position: "relative",
                                                            }}>
                                                                <div style={{
                                                                    background: "linear-gradient(135deg, #2a2a3e 0%, #1e2a3e 100%)",
                                                                    borderRadius: "14px",
                                                                    padding: "12px",
                                                                }}>
                                                                    <div style={{
                                                                        width: "100%",
                                                                        height: "120px",
                                                                        background: "linear-gradient(135deg, #4a5568 20%, #2d3748 80%)",
                                                                        borderRadius: "10px",
                                                                        marginBottom: "12px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        fontSize: "50px",
                                                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                                                    }}>
                                                                        🚗
                                                                    </div>
                                                                    <div style={{
                                                                        textAlign: "center",
                                                                        borderBottom: "1px solid rgba(16, 185, 129, 0.3)",
                                                                        paddingBottom: "8px",
                                                                        marginBottom: "8px",
                                                                    }}>
                                                                        <h4 style={{
                                                                            color: "#e0e0e0",
                                                                            fontSize: "11px",
                                                                            fontWeight: "600",
                                                                            margin: 0,
                                                                            letterSpacing: "2px",
                                                                            textTransform: "uppercase",
                                                                        }}>
                                                                            — LONG BEACH, CALIFORNIA —
                                                                        </h4>
                                                                    </div>
                                                                    <div style={{ marginBottom: "8px" }}>
                                                                        <p style={{
                                                                            color: "#fff",
                                                                            fontSize: "13px",
                                                                            fontWeight: "bold",
                                                                            margin: "0 0 4px 0",
                                                                        }}>
                                                                            Luxury Vehicles
                                                                        </p>
                                                                        <p style={{
                                                                            color: "#999",
                                                                            fontSize: "10px",
                                                                            margin: 0,
                                                                            lineHeight: "1.3",
                                                                        }}>
                                                                            Tesla Model S & Range Rover. High-end vehicle collection.
                                                                        </p>
                                                                    </div>
                                                                    <div style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "flex-end",
                                                                    }}>
                                                                        <div style={{
                                                                            color: "#10b981",
                                                                            fontSize: "12px",
                                                                            fontWeight: "bold",
                                                                        }}>
                                                                            $215K
                                                                        </div>
                                                                        <div style={{
                                                                            width: "25px",
                                                                            height: "25px",
                                                                            background: "#fff",
                                                                            borderRadius: "4px",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            fontSize: "8px",
                                                                        }}>
                                                                            QR
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* NFT Card 4 - Investment Portfolio */}
                                                            <div style={{
                                                                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                                                                borderRadius: "16px",
                                                                padding: "3px",
                                                                boxShadow: "0 0 30px rgba(236, 72, 153, 0.6), inset 0 0 20px rgba(236, 72, 153, 0.2)",
                                                                border: "2px solid rgba(236, 72, 153, 0.8)",
                                                                position: "relative",
                                                            }}>
                                                                <div style={{
                                                                    background: "linear-gradient(135deg, #2a2a3e 0%, #1e2a3e 100%)",
                                                                    borderRadius: "14px",
                                                                    padding: "12px",
                                                                }}>
                                                                    <div style={{
                                                                        width: "100%",
                                                                        height: "120px",
                                                                        background: "linear-gradient(135deg, #4a5568 20%, #2d3748 80%)",
                                                                        borderRadius: "10px",
                                                                        marginBottom: "12px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        fontSize: "50px",
                                                                        border: "1px solid rgba(236, 72, 153, 0.3)",
                                                                    }}>
                                                                        💎
                                                                    </div>
                                                                    <div style={{
                                                                        textAlign: "center",
                                                                        borderBottom: "1px solid rgba(236, 72, 153, 0.3)",
                                                                        paddingBottom: "8px",
                                                                        marginBottom: "8px",
                                                                    }}>
                                                                        <h4 style={{
                                                                            color: "#e0e0e0",
                                                                            fontSize: "11px",
                                                                            fontWeight: "600",
                                                                            margin: 0,
                                                                            letterSpacing: "2px",
                                                                            textTransform: "uppercase",
                                                                        }}>
                                                                            — DETROIT, MICHIGAN —
                                                                        </h4>
                                                                    </div>
                                                                    <div style={{ marginBottom: "8px" }}>
                                                                        <p style={{
                                                                            color: "#fff",
                                                                            fontSize: "13px",
                                                                            fontWeight: "bold",
                                                                            margin: "0 0 4px 0",
                                                                        }}>
                                                                            Investment Portfolio
                                                                        </p>
                                                                        <p style={{
                                                                            color: "#999",
                                                                            fontSize: "10px",
                                                                            margin: 0,
                                                                            lineHeight: "1.3",
                                                                        }}>
                                                                            Stocks, crypto & cash holdings. Diversified investment assets.
                                                                        </p>
                                                                    </div>
                                                                    <div style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "flex-end",
                                                                    }}>
                                                                        <div style={{
                                                                            color: "#ec4899",
                                                                            fontSize: "12px",
                                                                            fontWeight: "bold",
                                                                        }}>
                                                                            $285K
                                                                        </div>
                                                                        <div style={{
                                                                            width: "25px",
                                                                            height: "25px",
                                                                            background: "#fff",
                                                                            borderRadius: "4px",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            fontSize: "8px",
                                                                        }}>
                                                                            QR
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* Regular Asset List for Other Users */
                                                        user.assets.map((category, idx) => (
                                                            <div key={idx} style={{
                                                                background: "rgba(255, 255, 255, 0.05)",
                                                                borderRadius: "12px",
                                                                padding: "15px",
                                                                marginBottom: "15px",
                                                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                                            }}>
                                                                <h4 style={{
                                                                    color: "#fff",
                                                                    fontSize: "16px",
                                                                    marginBottom: "10px",
                                                                    fontWeight: "600",
                                                                }}>
                                                                    {category.type}
                                                                </h4>
                                                                {category.items.map((item, itemIdx) => (
                                                                    <div key={itemIdx} style={{
                                                                        color: "#ccc",
                                                                        fontSize: "14px",
                                                                        marginBottom: "5px",
                                                                        paddingLeft: "15px",
                                                                    }}>
                                                                        • {item}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))
                                                    )}

                                                    {/* Mint Status Display for Emma Richardson */}
                                                    {user.id === 1 && mintStatus.message && (
                                                        <div style={{
                                                            marginTop: "15px",
                                                            padding: "12px",
                                                            borderRadius: "10px",
                                                            background: mintStatus.type === 'error'
                                                                ? "rgba(239, 68, 68, 0.2)"
                                                                : mintStatus.type === 'success'
                                                                    ? "rgba(16, 185, 129, 0.2)"
                                                                    : "rgba(147, 112, 219, 0.2)",
                                                            border: `1px solid ${mintStatus.type === 'error'
                                                                ? "#ef4444"
                                                                : mintStatus.type === 'success'
                                                                    ? "#10b981"
                                                                    : "#9370db"
                                                                }`,
                                                            color: mintStatus.type === 'error'
                                                                ? "#ef4444"
                                                                : mintStatus.type === 'success'
                                                                    ? "#10b981"
                                                                    : "#9370db",
                                                            fontSize: "13px",
                                                            textAlign: "center",
                                                            fontWeight: "600",
                                                        }}>
                                                            {mintStatus.type === 'loading' && "🎨 "}
                                                            {mintStatus.type === 'success' && "✅ "}
                                                            {mintStatus.type === 'error' && "❌ "}
                                                            {mintStatus.message}
                                                            {mintStatus.txHash && (
                                                                <div style={{ marginTop: "8px" }}>
                                                                    <a
                                                                        href={`https://sepolia.mantlescan.xyz/tx/${mintStatus.txHash}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        style={{
                                                                            color: "#10b981",
                                                                            textDecoration: "underline",
                                                                            fontWeight: "bold",
                                                                            fontSize: "12px",
                                                                        }}
                                                                    >
                                                                        View on Explorer →
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Mint Button for Emma Richardson */}
                                                    {user.id === 1 && (
                                                        <button
                                                            onClick={handleMintNFT}
                                                            disabled={isPending}
                                                            style={{
                                                                width: "100%",
                                                                padding: "12px",
                                                                borderRadius: "12px",
                                                                border: "none",
                                                                background: isPending
                                                                    ? "rgba(147, 112, 219, 0.5)"
                                                                    : "linear-gradient(135deg, #9370db, #6a5acd)",
                                                                color: "#fff",
                                                                fontSize: "16px",
                                                                fontWeight: "bold",
                                                                cursor: isPending ? "not-allowed" : "pointer",
                                                                marginTop: "10px",
                                                            }}
                                                        >
                                                            {isPending ? "Trading..." : "Trade"}
                                                        </button>
                                                    )}

                                                    {/* Close Button */}
                                                    <button
                                                        onClick={() => setSelectedUser(null)}
                                                        style={{
                                                            width: "100%",
                                                            padding: "12px",
                                                            borderRadius: "12px",
                                                            border: "none",
                                                            background: "linear-gradient(135deg, #10b981, #059669)",
                                                            color: "#fff",
                                                            fontSize: "16px",
                                                            fontWeight: "bold",
                                                            cursor: "pointer",
                                                            marginTop: "10px",
                                                        }}
                                                    >
                                                        Close
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{
                            padding: "40px 20px",
                            textAlign: "center",
                            color: "#888",
                        }}>
                            <p style={{ fontSize: "16px", marginBottom: "10px" }}>
                                🔌 Please connect your wallet to Mantle Sepolia (5003)
                            </p>
                            <p style={{ fontSize: "14px" }}>
                                Connect your wallet and switch to the correct network to view properties
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
