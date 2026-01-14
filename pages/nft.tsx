import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import NFTCard from "../components/nftcard";

export default function NFTPage() {
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [selectedNFT, setSelectedNFT] = useState<number | null>(null);

    // NFT Data
    const nfts = [
        {
            id: 1,
            name: "Cosmic Penthouse",
            location: "MANHATTAN, NEW YORK",
            description: "Ultra-luxury penthouse with panoramic city views. Premium digital real estate asset.",
            image: "🌃",
            price: "$2.5M",
            rarity: "Legendary",
            color: "rgba(147, 51, 234, 0.8)", // Purple
            glowColor: "rgba(147, 51, 234, 0.6)",
        },
        {
            id: 2,
            name: "Cyber Villa",
            location: "MIAMI BEACH, FLORIDA",
            description: "Futuristic beachfront property with smart home integration and ocean views.",
            image: "🏖️",
            price: "$1.8M",
            rarity: "Epic",
            color: "rgba(59, 130, 246, 0.8)", // Blue
            glowColor: "rgba(59, 130, 246, 0.6)",
        },
        {
            id: 3,
            name: "Neon Tower Suite",
            location: "TOKYO, JAPAN",
            description: "High-rise luxury suite in the heart of Tokyo. Modern architecture meets tradition.",
            image: "🏙️",
            price: "$3.2M",
            rarity: "Legendary",
            color: "rgba(236, 72, 153, 0.8)", // Pink
            glowColor: "rgba(236, 72, 153, 0.6)",
        },
        {
            id: 4,
            name: "Alpine Chalet",
            location: "ASPEN, COLORADO",
            description: "Exclusive mountain retreat with ski-in/ski-out access and breathtaking views.",
            image: "⛷️",
            price: "$4.1M",
            rarity: "Mythic",
            color: "rgba(34, 197, 94, 0.8)", // Green
            glowColor: "rgba(34, 197, 94, 0.6)",
        },
        {
            id: 5,
            name: "Desert Oasis",
            location: "DUBAI, UAE",
            description: "Architectural masterpiece in the desert. Infinity pool and private helipad included.",
            image: "🏜️",
            price: "$5.5M",
            rarity: "Mythic",
            color: "rgba(251, 146, 60, 0.8)", // Orange
            glowColor: "rgba(251, 146, 60, 0.6)",
        },
    ];

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case "Mythic":
                return "#fbbf24"; // Gold
            case "Legendary":
                return "#a78bfa"; // Purple
            case "Epic":
                return "#60a5fa"; // Blue
            default:
                return "#10b981"; // Green
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(180deg, #0a0a1a 0%, #1a1030 30%, #2d1f4f 60%, #1a1030 100%)",
            padding: "40px 20px",
            fontFamily: "system-ui, sans-serif",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Stars Background */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                    radial-gradient(2px 2px at 20px 30px, white, transparent),
                    radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
                    radial-gradient(1px 1px at 90px 40px, white, transparent),
                    radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.9), transparent),
                    radial-gradient(1px 1px at 230px 80px, white, transparent),
                    radial-gradient(2px 2px at 300px 150px, rgba(255,255,255,0.7), transparent),
                    radial-gradient(1px 1px at 400px 60px, white, transparent),
                    radial-gradient(2px 2px at 500px 200px, rgba(255,255,255,0.8), transparent),
                    radial-gradient(1px 1px at 600px 100px, white, transparent),
                    radial-gradient(2px 2px at 700px 180px, white, transparent),
                    radial-gradient(1px 1px at 800px 50px, rgba(255,255,255,0.9), transparent),
                    radial-gradient(2px 2px at 900px 130px, white, transparent),
                    radial-gradient(1px 1px at 1000px 90px, rgba(255,255,255,0.7), transparent)
                `,
                backgroundSize: "1000px 400px",
                animation: "twinkle 4s ease-in-out infinite",
                pointerEvents: "none",
            }} />

            {/* Big Moon */}
            <div style={{
                position: "absolute",
                top: "5%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "350px",
                height: "350px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 30% 30%, #4a4a6a 0%, #2a2a4a 50%, #1a1a3a 100%)",
                boxShadow: `
                    0 0 60px rgba(100, 100, 150, 0.3),
                    0 0 120px rgba(100, 100, 150, 0.2),
                    inset 0 0 60px rgba(0, 0, 0, 0.5)
                `,
                opacity: 0.8,
                pointerEvents: "none",
            }} />

            {/* Reflective Floor */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "35%",
                background: "linear-gradient(180deg, transparent 0%, rgba(20, 20, 40, 0.3) 20%, rgba(30, 30, 60, 0.5) 100%)",
                pointerEvents: "none",
            }} />

            {/* Floor Reflection Line */}
            <div style={{
                position: "absolute",
                bottom: "34%",
                left: 0,
                right: 0,
                height: "2px",
                background: "linear-gradient(90deg, transparent, rgba(100, 150, 255, 0.3), rgba(255, 100, 255, 0.3), rgba(100, 255, 200, 0.3), transparent)",
                pointerEvents: "none",
            }} />

            {/* Twinkle Animation */}
            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `}</style>
            {/* Header */}
            <div style={{
                maxWidth: "1600px",
                margin: "0 auto",
                marginBottom: "60px",
                position: "relative",
                zIndex: 10,
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "30px",
                }}>
                    <Link href="/" style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 20px",
                        background: "rgba(10, 10, 30, 0.8)",
                        border: "2px solid #a78bfa",
                        borderRadius: "8px",
                        color: "#a78bfa",
                        textDecoration: "none",
                        fontFamily: "monospace",
                        fontSize: "14px",
                        fontWeight: "bold",
                        letterSpacing: "1px",
                        boxShadow: "0 0 15px #a78bfa40",
                        transition: "all 0.3s",
                    }}>
                        HOME
                    </Link>
                    <ConnectButton />
                </div>

                {/* Centered Title */}
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h1 style={{
                        color: "#fff",
                        fontSize: "52px",
                        fontWeight: "bold",
                        margin: "0 0 15px 0",
                        background: "linear-gradient(90deg, #a78bfa 0%, #ec4899 50%, #06b6d4 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        textShadow: "0 0 60px rgba(167, 139, 250, 0.5)",
                        fontFamily: "system-ui, sans-serif",
                        letterSpacing: "1px",
                    }}>
                        Premium NFT Collection
                    </h1>
                    <p style={{
                        color: "#8b9dc3",
                        fontSize: "16px",
                        margin: 0,
                        letterSpacing: "0.5px",
                    }}>
                        Tokenized Real World Assets on Blockchain
                    </p>
                </div>

                {/* Stats Bar */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                }}>
                    {[
                        { label: "TOTAL ITEMS", value: "4", color: "#06b6d4" },
                        { label: "FLOOR PRICE", value: "$89K", color: "#ec4899" },
                        { label: "TOTAL VOLUME", value: "$5.3M", color: "#a78bfa" },
                        { label: "OWNERS", value: "4", color: "#10b981" },
                    ].map((stat, idx) => (
                        <div key={idx} style={{
                            background: "rgba(10, 10, 30, 0.8)",
                            borderRadius: "8px",
                            padding: "15px 30px",
                            border: `2px solid ${stat.color}`,
                            boxShadow: `0 0 20px ${stat.color}40, inset 0 0 20px ${stat.color}10`,
                            textAlign: "center",
                            minWidth: "140px",
                        }}>
                            <div style={{
                                color: stat.color,
                                fontSize: "11px",
                                marginBottom: "8px",
                                letterSpacing: "1px",
                                fontFamily: "system-ui, sans-serif",
                                fontWeight: "600",
                            }}>
                                {stat.label}
                            </div>
                            <div style={{
                                color: "#fff",
                                fontSize: "28px",
                                fontWeight: "bold",
                                fontFamily: "system-ui, sans-serif",
                                textShadow: `0 0 20px ${stat.color}`,
                            }}>
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {/* RWA NFT Cards Grid */}
            <div style={{
                maxWidth: "1600px",
                margin: "0 auto 60px auto",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "30px",
                justifyItems: "center",
                padding: "0 20px",
                position: "relative",
                zIndex: 10,
            }}>
                {/* Manhattan Penthouse - Prime/Luxury */}
                <NFTCard
                    id={1001}
                    name="Manhattan Penthouse"
                    description="Tokenized luxury penthouse in Manhattan, NYC. Median income area >$200K+. 2,450 sq ft with panoramic city views. Annual yield: 8.5%"
                    image="/manha.jpg"
                    price="$2.8M"
                    rarity="Prime"
                    color="#f59e0b"
                    glowColor="#f59e0b"
                    contractAddress="0x0CBfC37b9346f5Aa39fAaB7dc37330Bfa74D04F6"
                />

                {/* California Modern Home - Wealthy */}
                <NFTCard
                    id={1002}
                    name="Los Altos Residence"
                    description="Tokenized modern home in Los Altos, California. High-ceiling living space with fireplace. Top-tier school district. Annual yield: 7.2%"
                    image="/nft/california.png"
                    price="$1.9M"
                    rarity="Elite"
                    color="#10b981"
                    glowColor="#10b981"
                    contractAddress="0x3eAfB87575023DBa4537fFC87aC5d7E7537C55fD"
                />

                {/* Arizona Suburban - Middle Class */}
                <NFTCard
                    id={1003}
                    name="Phoenix Suburb Villa"
                    description="Tokenized suburban property in Phoenix metro. Outdoor patio with desert views. Median income $70K-$100K area. Annual yield: 6.5%"
                    image="/nft/middle.png"
                    price="$485K"
                    rarity="Standard"
                    color="#3b82f6"
                    glowColor="#3b82f6"
                    contractAddress="0x82068a566E4a1aE88FbdeBDbfdbFb8c1c4294B8b"
                />

                {/* Modest Apartment - Affordable */}
                <NFTCard
                    id={1004}
                    name="Detroit Studio"
                    description="Tokenized affordable apartment in Detroit. Compact studio with kitchenette. Entry-level investment opportunity. Annual yield: 9.2%"
                    image="/nft/verylow.png"
                    price="$89K"
                    rarity="Starter"
                    color="#8b5cf6"
                    glowColor="#8b5cf6"
                    contractAddress="0xDdcD4075fc8a09Aa8db3Fe6a17640D77Aee22745"
                />
            </div>


            {/* Modal for selected NFT */}
            {selectedNFT !== null && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        backdropFilter: "blur(10px)",
                    }}
                    onClick={() => setSelectedNFT(null)}
                >
                    <div
                        style={{
                            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                            borderRadius: "24px",
                            padding: "40px",
                            maxWidth: "600px",
                            width: "90%",
                            border: `2px solid ${nfts.find(n => n.id === selectedNFT)?.color}`,
                            boxShadow: `0 0 60px ${nfts.find(n => n.id === selectedNFT)?.glowColor}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {nfts.find(n => n.id === selectedNFT) && (() => {
                            const nft = nfts.find(n => n.id === selectedNFT)!;
                            return (
                                <>
                                    <div style={{
                                        textAlign: "center",
                                        marginBottom: "30px",
                                    }}>
                                        <div style={{
                                            fontSize: "100px",
                                            marginBottom: "20px",
                                        }}>
                                            {nft.image}
                                        </div>
                                        <h2 style={{
                                            color: "#fff",
                                            fontSize: "32px",
                                            margin: "0 0 10px 0",
                                        }}>
                                            {nft.name}
                                        </h2>
                                        <p style={{
                                            color: "#a0aec0",
                                            fontSize: "14px",
                                            margin: 0,
                                        }}>
                                            {nft.location}
                                        </p>
                                    </div>

                                    <div style={{
                                        background: "rgba(255, 255, 255, 0.05)",
                                        borderRadius: "16px",
                                        padding: "20px",
                                        marginBottom: "20px",
                                    }}>
                                        <p style={{
                                            color: "#a0aec0",
                                            fontSize: "14px",
                                            lineHeight: "1.6",
                                            margin: 0,
                                        }}>
                                            {nft.description}
                                        </p>
                                    </div>

                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "15px",
                                        marginBottom: "30px",
                                    }}>
                                        <div style={{
                                            background: "rgba(255, 255, 255, 0.05)",
                                            borderRadius: "12px",
                                            padding: "15px",
                                        }}>
                                            <div style={{ color: "#888", fontSize: "11px", marginBottom: "5px" }}>Rarity</div>
                                            <div style={{ color: getRarityColor(nft.rarity), fontSize: "18px", fontWeight: "bold" }}>{nft.rarity}</div>
                                        </div>
                                        <div style={{
                                            background: "rgba(255, 255, 255, 0.05)",
                                            borderRadius: "12px",
                                            padding: "15px",
                                        }}>
                                            <div style={{ color: "#888", fontSize: "11px", marginBottom: "5px" }}>Token ID</div>
                                            <div style={{ color: "#fff", fontSize: "18px", fontWeight: "bold" }}>#{nft.id}</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedNFT(null)}
                                        style={{
                                            width: "100%",
                                            padding: "16px",
                                            background: `linear-gradient(135deg, ${nft.color} 0%, ${nft.glowColor} 100%)`,
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "12px",
                                            fontSize: "16px",
                                            fontWeight: "bold",
                                            cursor: "pointer",
                                            boxShadow: `0 4px 20px ${nft.glowColor}`,
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

            {/* Pulse Animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.5;
                    }
                    50% {
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
